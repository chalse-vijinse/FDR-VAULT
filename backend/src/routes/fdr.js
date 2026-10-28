import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyRoleUsers } from '../services/notificationService.js';
import { upload } from '../middleware/upload.js';
import { handleDocUpload } from './documents.js';

const router = express.Router();

// GET /api/fdr - List FDR records with search, filter, pagination
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      search,
      status,
      record_type,
      institution_id,
      maturity_range,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];

    let whereClause = 'WHERE 1=1';

    // Role-based data isolation
    if (req.user.role === 'INSTITUTION_ADMIN') {
      whereClause += ' AND f.institution_id = ?';
      params.push(req.user.institution_id);
    } else if (institution_id && institution_id !== 'All') {
      whereClause += ' AND f.institution_id = ?';
      params.push(institution_id);
    }

    if (search) {
      whereClause += ' AND (f.fdr_number LIKE ? OR f.bank_name LIKE ? OR f.deposit_holder_name LIKE ? OR i.name LIKE ? OR f.approval_reference LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (status && status !== 'All') {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }

    if (record_type && record_type !== 'All') {
      whereClause += ' AND f.record_type = ?';
      params.push(record_type);
    }

    // Maturity filter: 'matured', 'upcoming-30', 'upcoming-15', 'upcoming-7'
    if (maturity_range === 'matured') {
      whereClause += " AND f.maturity_date <= date('now')";
    } else if (maturity_range === 'upcoming-30') {
      whereClause += " AND f.maturity_date > date('now') AND f.maturity_date <= date('now', '+30 days')";
    } else if (maturity_range === 'upcoming-15') {
      whereClause += " AND f.maturity_date > date('now') AND f.maturity_date <= date('now', '+15 days')";
    } else if (maturity_range === 'upcoming-7') {
      whereClause += " AND f.maturity_date > date('now') AND f.maturity_date <= date('now', '+7 days')";
    }

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM fdr_records f
      JOIN institutions i ON f.institution_id = i.id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const totalRecords = countRes[0].total || countRes[0]['COUNT(*)'] || 0;

    // Allowed sort columns
    const allowedSorts = ['created_at', 'maturity_date', 'issue_date', 'deposit_amount', 'status', 'bank_name', 'fdr_number'];
    const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const listQuery = `
      SELECT f.*,
             i.name as institution_name,
             i.institution_code,
             u.full_name as assigned_officer_name,
             (SELECT COUNT(*) FROM documents d WHERE d.fdr_id = f.id) as document_count,
             (SELECT COUNT(*) FROM release_requests r WHERE r.fdr_id = f.id) as release_request_count
      FROM fdr_records f
      JOIN institutions i ON f.institution_id = i.id
      LEFT JOIN users u ON f.assigned_officer_id = u.id
      ${whereClause}
      ORDER BY f.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const records = await db.query(listQuery, [...params, parseInt(limit, 10), offset]);

    res.json({
      success: true,
      data: records,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/fdr/:id - FDR Details with documents, verification tasks, and history
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const fdrs = await db.query(
      `SELECT f.*,
              i.name as institution_name,
              i.institution_code,
              i.state as institution_state,
              i.contact_name as institution_contact,
              u.full_name as assigned_officer_name,
              u.email as assigned_officer_email,
              c.full_name as created_by_name
       FROM fdr_records f
       JOIN institutions i ON f.institution_id = i.id
       LEFT JOIN users u ON f.assigned_officer_id = u.id
       LEFT JOIN users c ON f.created_by = c.id
       WHERE f.id = ?`,
      [id]
    );

    if (fdrs.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const fdr = fdrs[0];

    // Enforce institution data isolation
    if (req.user.role === 'INSTITUTION_ADMIN' && String(fdr.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot view records belonging to another institution.' });
    }

    // Fetch documents
    const documents = await db.query(
      `SELECT d.*, u.full_name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.fdr_id = ?
       ORDER BY d.created_at DESC`,
      [id]
    );

    // Fetch verification history
    const history = await db.query(
      `SELECT vh.*, u.full_name as action_by_name, u.role as action_by_role
       FROM verification_history vh
       LEFT JOIN users u ON vh.action_by = u.id
       WHERE vh.fdr_id = ?
       ORDER BY vh.created_at DESC`,
      [id]
    );

    // Fetch active verification task
    const tasks = await db.query(
      `SELECT vt.*, u.full_name as officer_name, b.full_name as assigned_by_name
       FROM verification_tasks vt
       LEFT JOIN users u ON vt.assigned_to = u.id
       LEFT JOIN users b ON vt.assigned_by = b.id
       WHERE vt.fdr_id = ?
       ORDER BY vt.created_at DESC LIMIT 1`,
      [id]
    );

    // Check for possible duplicate FDR numbers in the database
    let duplicateWarnings = [];
    if (fdr.fdr_number) {
      const dupes = await db.query(
        `SELECT id, institution_id, fdr_number, status, deposit_amount 
         FROM fdr_records 
         WHERE fdr_number = ? AND id != ?`,
        [fdr.fdr_number, id]
      );
      if (dupes.length > 0) {
        duplicateWarnings = dupes.map(d => ({
          fdrId: d.id,
          status: d.status,
          amount: d.deposit_amount,
          message: `Warning: Same FDR reference number exists in record #${d.id} with status '${d.status}'.`
        }));
      }
    }

    res.json({
      success: true,
      data: {
        ...fdr,
        documents,
        verificationHistory: history,
        activeTask: tasks.length > 0 ? tasks[0] : null,
        duplicateWarnings
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/fdr - Create new FDR record
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      institution_id,
      record_type = 'Fixed Deposit Receipt',
      fdr_number,
      bank_name,
      branch_name,
      ifsc_code,
      deposit_amount,
      currency = 'INR',
      issue_date,
      maturity_date,
      deposit_holder_name,
      deposit_purpose,
      approval_reference,
      additional_notes
    } = req.body;

    const targetInstId = req.user.role === 'INSTITUTION_ADMIN' ? req.user.institution_id : institution_id;

    if (!targetInstId) {
      return res.status(400).json({ success: false, message: 'Valid institution must be specified.' });
    }

    // Validations
    if (!deposit_amount || parseFloat(deposit_amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount must be a positive number.' });
    }

    if (!issue_date || !maturity_date) {
      return res.status(400).json({ success: false, message: 'Issue date and maturity date are required.' });
    }

    const issue = new Date(issue_date);
    const maturity = new Date(maturity_date);
    if (maturity <= issue) {
      return res.status(400).json({ success: false, message: 'Maturity date must not precede or equal the issue date.' });
    }

    if (!deposit_holder_name || !deposit_purpose) {
      return res.status(400).json({ success: false, message: 'Deposit holder name and deposit purpose are mandatory fields.' });
    }

    // Duplicate check warning
    let hasDuplicate = false;
    let dupDetails = null;
    if (fdr_number && fdr_number.trim()) {
      const dupes = await db.query('SELECT id, status FROM fdr_records WHERE fdr_number = ?', [fdr_number.trim()]);
      if (dupes.length > 0) {
        hasDuplicate = true;
        dupDetails = `Duplicate Warning: Reference number '${fdr_number}' already registered in record #${dupes[0].id} (${dupes[0].status}). Flagged for verification officer review.`;
      }
    }

    const result = await db.execute(
      `INSERT INTO fdr_records (
        institution_id, record_type, fdr_number, bank_name, branch_name, ifsc_code,
        deposit_amount, currency, issue_date, maturity_date, deposit_holder_name,
        deposit_purpose, approval_reference, status, discrepancy_flag, discrepancy_details,
        verification_status_label, additional_notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, 'Not Reviewed', ?, ?)`,
      [
        targetInstId,
        record_type,
        fdr_number ? fdr_number.trim() : null,
        bank_name ? bank_name.trim() : null,
        branch_name ? branch_name.trim() : null,
        ifsc_code ? ifsc_code.trim().toUpperCase() : null,
        parseFloat(deposit_amount),
        currency,
        issue_date,
        maturity_date,
        deposit_holder_name.trim(),
        deposit_purpose.trim(),
        approval_reference ? approval_reference.trim() : null,
        hasDuplicate ? 1 : 0,
        dupDetails,
        additional_notes || null,
        req.user.id
      ]
    );

    const fdrId = result.insertId;

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'FDR_CREATED',
      entityType: 'FDR',
      entityId: fdrId,
      summary: `Created new draft deposit record #${fdrId} (${record_type}, ₹${deposit_amount}).`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'FDR record created in Draft status. Please upload supporting documents and submit for verification.',
      fdrId,
      hasDuplicateWarning: hasDuplicate
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/fdr/:id - Edit permitted fields
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const record = existing[0];

    // Enforce institution data isolation
    if (req.user.role === 'INSTITUTION_ADMIN' && String(record.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot edit records for another institution.' });
    }

    // Editing restrictions: Only allowed in 'Draft', 'Clarification Required', 'Additional Documents Required', or by Super Admin
    if (req.user.role === 'INSTITUTION_ADMIN' && !['Draft', 'Clarification Required', 'Additional Documents Required'].includes(record.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit record while it is '${record.status}'. Editing is only permitted in Draft or when Clarification / Additional Documents are requested.`
      });
    }

    const {
      record_type,
      fdr_number,
      bank_name,
      branch_name,
      ifsc_code,
      deposit_amount,
      issue_date,
      maturity_date,
      deposit_holder_name,
      deposit_purpose,
      approval_reference,
      additional_notes
    } = req.body;

    if (deposit_amount && parseFloat(deposit_amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount must be positive.' });
    }

    if (issue_date && maturity_date) {
      if (new Date(maturity_date) <= new Date(issue_date)) {
        return res.status(400).json({ success: false, message: 'Maturity date must not precede issue date.' });
      }
    }

    await db.execute(
      `UPDATE fdr_records 
       SET record_type = ?, fdr_number = ?, bank_name = ?, branch_name = ?, ifsc_code = ?,
           deposit_amount = ?, issue_date = ?, maturity_date = ?, deposit_holder_name = ?,
           deposit_purpose = ?, approval_reference = ?, additional_notes = ?
       WHERE id = ?`,
      [
        record_type || record.record_type,
        fdr_number !== undefined ? fdr_number : record.fdr_number,
        bank_name !== undefined ? bank_name : record.bank_name,
        branch_name !== undefined ? branch_name : record.branch_name,
        ifsc_code !== undefined ? ifsc_code : record.ifsc_code,
        deposit_amount ? parseFloat(deposit_amount) : record.deposit_amount,
        issue_date || record.issue_date,
        maturity_date || record.maturity_date,
        deposit_holder_name || record.deposit_holder_name,
        deposit_purpose || record.deposit_purpose,
        approval_reference !== undefined ? approval_reference : record.approval_reference,
        additional_notes !== undefined ? additional_notes : record.additional_notes,
        id
      ]
    );

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'FDR_UPDATED',
      entityType: 'FDR',
      entityId: id,
      summary: `Updated FDR details for record #${id}.`,
      ip: req.ip
    });

    res.json({ success: true, message: 'FDR record updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/fdr/:id/submit - Submit record for verification
router.post('/:id/submit', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const record = existing[0];

    // Check scope
    if (req.user.role === 'INSTITUTION_ADMIN' && String(record.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!['Draft', 'Clarification Required', 'Additional Documents Required'].includes(record.status)) {
      return res.status(400).json({
        success: false,
        message: `Record is already in '${record.status}' status and cannot be submitted.`
      });
    }

    // Validate that at least one document is uploaded
    const docs = await db.query('SELECT id FROM documents WHERE fdr_id = ?', [id]);
    if (docs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one supporting document (e.g., FDR Certificate scan) must be uploaded before submitting for verification.'
      });
    }

    const newStatus = ['Additional Documents Required', 'Clarification Required'].includes(record.status) ? 'Resubmitted' : 'Submitted';

    await db.execute('UPDATE fdr_records SET status = ? WHERE id = ?', [newStatus, id]);

    // Record in verification history
    await db.execute(
      `INSERT INTO verification_history (fdr_id, previous_status, new_status, action_by, findings)
       VALUES (?, ?, ?, ?, ?)`,
      [id, record.status, newStatus, req.user.id, 'Record submitted by institution administrator for verification.']
    );

    // Notify Super Admin & Verification Officers
    await notifyRoleUsers({
      role: 'SUPER_ADMIN',
      title: 'New FDR Submission for Verification',
      message: `Deposit record #${id} (${record.fdr_number || 'No Ref'}) submitted for verification. Assignment required.`,
      type: 'FDR_SUBMISSION',
      linkUrl: `/verifications/${id}`
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'FDR_SUBMITTED',
      entityType: 'FDR',
      entityId: id,
      summary: `Submitted deposit record #${id} for verification. Transition: ${record.status} -> ${newStatus}.`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Record successfully submitted for verification. Current status: ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/fdr/:id/documents - Direct upload alias
router.post('/:id/documents', authenticate, upload.single('document'), handleDocUpload);

export default router;
