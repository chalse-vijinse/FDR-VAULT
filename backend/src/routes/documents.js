import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { processDocumentOCR } from '../services/ocrService.js';
import { logAudit } from '../services/auditService.js';

import { isSupabaseConfigured, uploadToSupabaseStorage, downloadFromSupabaseStorage } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

const router = express.Router();

// POST /api/fdr/:id/documents or /api/documents/fdr/:id - Upload document for FDR
const handleDocUpload = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_type = 'FDR Certificate' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
    }

    const fdrs = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (fdrs.length === 0) {
      // Remove uploaded file if FDR record does not exist
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Associated FDR record not found.' });
    }

    const fdr = fdrs[0];

    // Check scope
    if (req.user.role === 'INSTITUTION_ADMIN' && String(fdr.institution_id) !== String(req.user.institution_id)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Insert document record
    const result = await db.execute(
      `INSERT INTO documents (
        fdr_id, document_type, original_filename, stored_filename, file_path,
        file_size, mime_type, ocr_status, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        id,
        document_type,
        req.file.originalname,
        req.file.filename,
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        req.user.id
      ]
    );

    const docId = result.insertId;

    // Optional sync to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const supaRes = await uploadToSupabaseStorage(req.file.filename, fileBuffer, req.file.mimetype);
        if (supaRes.success) {
          console.log(`[Documents] Document synced to Supabase Storage: ${supaRes.path}`);
        }
      } catch (supaErr) {
        console.warn('[Documents] Supabase Storage upload skipped:', supaErr.message);
      }
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: docId,
      summary: `Uploaded document '${req.file.originalname}' (${document_type}) for FDR #${id}.`,
      ip: req.ip
    });

    // Auto trigger OCR processing in background or immediately
    let ocrResult = null;
    try {
      ocrResult = await processDocumentOCR(req.file.path, req.file.mimetype, fdr);
      
      const summaryText = ocrResult.hasDiscrepancy 
        ? 'Discrepancy Detected between form and document values.'
        : 'OCR Completed: Values matched submitted form.';

      await db.execute(
        `UPDATE documents 
         SET ocr_status = 'Completed', ocr_raw_text = ?, ocr_extracted_json = ?, discrepancy_summary = ?
         WHERE id = ?`,
        [ocrResult.rawText, JSON.stringify(ocrResult.extracted), summaryText, docId]
      );

      // If discrepancy detected, update FDR record label & flag
      if (ocrResult.hasDiscrepancy) {
        await db.execute(
          `UPDATE fdr_records 
           SET discrepancy_flag = 1, verification_status_label = 'Discrepancy Detected',
               discrepancy_details = ?
           WHERE id = ?`,
          ['OCR engine detected mismatch in extracted fields. Manual verification required.', id]
        );
      } else {
        await db.execute(
          `UPDATE fdr_records 
           SET verification_status_label = 'OCR Completed'
           WHERE id = ? AND verification_status_label = 'Not Reviewed'`,
          [id]
        );
      }
    } catch (ocrErr) {
      console.warn('[Documents] Auto OCR background failed:', ocrErr.message);
      await db.execute(`UPDATE documents SET ocr_status = 'Failed' WHERE id = ?`, [docId]);
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully.',
      documentId: docId,
      ocrResult
    });
  } catch (err) {
    next(err);
  }
};

router.post('/fdr/:id/documents', authenticate, upload.single('document'), handleDocUpload);
router.post('/upload/:id', authenticate, upload.single('document'), handleDocUpload);

// GET /api/documents/:id - Access-controlled document download/preview
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const docs = await db.query(
      `SELECT d.*, f.institution_id 
       FROM documents d
       JOIN fdr_records f ON d.fdr_id = f.id
       WHERE d.id = ?`,
      [id]
    );

    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docs[0];

    // Enforce role isolation
    if (req.user.role === 'INSTITUTION_ADMIN' && String(doc.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this document.' });
    }

    const filePath = path.resolve(uploadDir, doc.stored_filename);
    if (!fs.existsSync(filePath)) {
      if (isSupabaseConfigured()) {
        try {
          const fileBuffer = await downloadFromSupabaseStorage(doc.stored_filename);
          if (fileBuffer) {
            res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
            return res.send(fileBuffer);
          }
        } catch (supaDlErr) {
          console.warn('[Documents] Failed to fetch from Supabase Storage:', supaDlErr.message);
        }
      }
      return res.status(404).json({ success: false, message: 'Physical file not found on server or cloud storage.' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/:id/process-ocr - Manually trigger or re-run OCR
router.post('/:id/process-ocr', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const docs = await db.query(
      `SELECT d.*, f.fdr_number, f.bank_name, f.deposit_amount, f.issue_date, f.maturity_date, f.deposit_holder_name, f.institution_id
       FROM documents d
       JOIN fdr_records f ON d.fdr_id = f.id
       WHERE d.id = ?`,
      [id]
    );

    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document record not found.' });
    }

    const doc = docs[0];

    // Enforce scope
    if (req.user.role === 'INSTITUTION_ADMIN' && String(doc.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filePath = path.resolve(uploadDir, doc.stored_filename);
    const ocrResult = await processDocumentOCR(filePath, doc.mime_type, doc);

    const summaryText = ocrResult.hasDiscrepancy 
      ? 'Discrepancy Detected between form and document values.'
      : 'OCR Completed: Values matched submitted form.';

    await db.execute(
      `UPDATE documents 
       SET ocr_status = 'Completed', ocr_raw_text = ?, ocr_extracted_json = ?, discrepancy_summary = ?
       WHERE id = ?`,
      [ocrResult.rawText, JSON.stringify(ocrResult.extracted), summaryText, id]
    );

    if (ocrResult.hasDiscrepancy) {
      await db.execute(
        `UPDATE fdr_records 
         SET discrepancy_flag = 1, verification_status_label = 'Discrepancy Detected',
             discrepancy_details = ?
         WHERE id = ?`,
        ['Discrepancy detected during OCR analysis. Human verification required.', doc.fdr_id]
      );
    }

    res.json({
      success: true,
      message: 'OCR analysis completed.',
      data: ocrResult
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/documents/:id/ocr-feedback - Human officer correction / verification of OCR
router.put('/:id/ocr-feedback', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { correctedValues, discrepancyFlag, officerNotes } = req.body;

    const docs = await db.query('SELECT * FROM documents WHERE id = ?', [id]);
    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docs[0];

    await db.execute(
      `UPDATE documents 
       SET ocr_extracted_json = ?, discrepancy_summary = ?
       WHERE id = ?`,
      [
        JSON.stringify(correctedValues),
        `Human verified by ${req.user.full_name}: ${officerNotes || 'Values confirmed.'}`,
        id
      ]
    );

    if (discrepancyFlag !== undefined) {
      await db.execute(
        `UPDATE fdr_records 
         SET discrepancy_flag = ?, verification_status_label = ?
         WHERE id = ?`,
        [discrepancyFlag ? 1 : 0, discrepancyFlag ? 'Discrepancy Detected' : 'Manual Verification Required', doc.fdr_id]
      );
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'OCR_CORRECTION_SAVED',
      entityType: 'DOCUMENT',
      entityId: id,
      summary: `Officer recorded human verification corrections on OCR values for document #${id}.`,
      ip: req.ip
    });

    res.json({ success: true, message: 'Human verification findings recorded.' });
  } catch (err) {
    next(err);
  }
});

export { handleDocUpload };
export default router;
