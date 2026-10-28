import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyRoleUsers } from '../services/notificationService.js';

const router = express.Router();

// GET /api/release-requests - List release requests
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, institution_id, search } = req.query;

    let sql = `
      SELECT r.*,
             f.fdr_number,
             f.deposit_amount,
             f.bank_name,
             f.maturity_date,
             i.name as institution_name,
             i.institution_code,
             u.full_name as assigned_officer_name,
             d.full_name as decision_by_name
      FROM release_requests r
      JOIN fdr_records f ON r.fdr_id = f.id
      JOIN institutions i ON r.institution_id = i.id
      LEFT JOIN users u ON r.assigned_officer_id = u.id
      LEFT JOIN users d ON r.decision_by = d.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (req.user.role === 'INSTITUTION_ADMIN') {
      sql += ' AND r.institution_id = ?';
      params.push(req.user.institution_id);
    } else if (institution_id && institution_id !== 'All') {
      sql += ' AND r.institution_id = ?';
      params.push(institution_id);
    }

    if (status && status !== 'All') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (r.request_reference LIKE ? OR f.fdr_number LIKE ? OR i.name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY r.created_at DESC';

    const requests = await db.query(sql, params);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// GET /api/release-requests/:id - Single release request details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const rows = await db.query(
      `SELECT r.*,
              f.fdr_number,
              f.deposit_amount,
              f.bank_name,
              f.issue_date,
              f.maturity_date,
              f.deposit_holder_name,
              f.approval_reference,
              i.name as institution_name,
              i.institution_code,
              i.state as institution_state,
              u.full_name as assigned_officer_name,
              d.full_name as decision_by_name,
              c.full_name as created_by_name
       FROM release_requests r
       JOIN fdr_records f ON r.fdr_id = f.id
       JOIN institutions i ON r.institution_id = i.id
       LEFT JOIN users u ON r.assigned_officer_id = u.id
       LEFT JOIN users d ON r.decision_by = d.id
       LEFT JOIN users c ON r.created_by = c.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Release request not found.' });
    }

    const request = rows[0];

    // Data isolation
    if (req.user.role === 'INSTITUTION_ADMIN' && String(request.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Fetch documents attached to this release request
    const docs = await db.query(
      `SELECT * FROM release_request_documents WHERE release_request_id = ? ORDER BY uploaded_at DESC`,
      [id]
    );

    // Fetch audit history
    const logs = await db.query(
      `SELECT * FROM audit_logs 
       WHERE entity_type = 'RELEASE_REQUEST' AND entity_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...request,
        attachedDocuments: docs,
        auditHistory: logs
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/release-requests - Submit release request
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { fdr_id, reason_for_release, compliance_notes } = req.body;

    if (!fdr_id || !reason_for_release || reason_for_release.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'FDR ID and substantive reason for release are required.' });
    }

    const fdrs = await db.query('SELECT * FROM fdr_records WHERE id = ?', [fdr_id]);
    if (fdrs.length === 0) {
      return res.status(404).json({ success: false, message: 'Associated FDR record not found.' });
    }

    const fdr = fdrs[0];

    // Check scope
    if (req.user.role === 'INSTITUTION_ADMIN' && String(fdr.institution_id) !== String(req.user.institution_id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Check if open request already exists
    const openReqs = await db.query(
      `SELECT id, status FROM release_requests 
       WHERE fdr_id = ? AND status NOT IN ('Rejected', 'Released')`,
      [fdr_id]
    );

    if (openReqs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `An active release request #${openReqs[0].id} already exists for this deposit in status '${openReqs[0].status}'.`
      });
    }

    const ref = `REL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    const result = await db.execute(
      `INSERT INTO release_requests (
        fdr_id, institution_id, request_reference, request_date, reason_for_release,
        status, clearance_remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, 'Submitted', ?, ?)`,
      [fdr_id, fdr.institution_id, ref, today, reason_for_release.trim(), compliance_notes || null, req.user.id]
    );

    const requestId = result.insertId;

    await notifyRoleUsers({
      role: 'SUPER_ADMIN',
      title: 'New Deposit Release Request',
      message: `Release request ${ref} submitted for FDR #${fdr.id} (₹${Number(fdr.deposit_amount).toLocaleString('en-IN')}).`,
      type: 'RELEASE_UPDATE',
      linkUrl: `/release-requests/${requestId}`
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'RELEASE_REQUEST_SUBMITTED',
      entityType: 'RELEASE_REQUEST',
      entityId: requestId,
      summary: `Submitted deposit release request ${ref} for FDR #${fdr_id}.`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Release request ${ref} submitted successfully. Pending administrative compliance review.`,
      requestId,
      requestReference: ref
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/release-requests/:id/decision - Authorized decision workflow
router.post('/:id/decision', authenticate, requireRole('SUPER_ADMIN', 'VERIFICATION_OFFICER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      action, // 'Under Review', 'Clearance Pending', 'Recommended', 'Approved', 'Rejected', 'Released'
      remarks,
      confirmationRef
    } = req.body;

    const validActions = [
      'Submitted',
      'Release Requested',
      'Under Review',
      'Release Under Review',
      'Clarification Required',
      'Additional Documents Required',
      'Clearance Pending',
      'Recommended',
      'Approved',
      'Release Approved',
      'Rejected',
      'Released'
    ];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: `Invalid action. Permitted: ${validActions.join(', ')}` });
    }

    const rows = await db.query('SELECT * FROM release_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Release request not found.' });
    }

    const reqRecord = rows[0];

    // Enforce role permission: Only Super Admin can mark as 'Approved', 'Release Approved', or 'Released'
    if (['Approved', 'Release Approved', 'Released'].includes(action) && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Final approval and release confirmation require Super Admin (Competent Authority) authorization.'
      });
    }

    await db.execute(
      `UPDATE release_requests 
       SET status = ?, clearance_remarks = ?, decision_by = ?, decision_date = datetime('now'), release_confirmation_ref = ?
       WHERE id = ?`,
      [action, remarks || reqRecord.clearance_remarks, req.user.id, confirmationRef || null, id]
    );

    // If released, also update the fdr_records status to Released
    if (action === 'Released') {
      await db.execute(
        `UPDATE fdr_records SET status = 'Released', verification_status_label = 'Lien Discharged / Released' WHERE id = ?`,
        [reqRecord.fdr_id]
      );
    }

    // Notify institution
    const instUsers = await db.query('SELECT id FROM users WHERE institution_id = ?', [reqRecord.institution_id]);
    for (const u of instUsers) {
      await createNotification({
        userId: u.id,
        institutionId: reqRecord.institution_id,
        title: `Release Request Status Updated: ${action}`,
        message: `Your deposit release request ${reqRecord.request_reference} has moved to status '${action}'. Remarks: ${remarks || 'Review in progress.'}`,
        type: 'RELEASE_UPDATE',
        linkUrl: `/release-requests/${id}`
      });
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `RELEASE_REQUEST_${action.toUpperCase().replace(/\s+/g, '_')}`,
      entityType: 'RELEASE_REQUEST',
      entityId: id,
      summary: `Updated release request ${reqRecord.request_reference} to '${action}'. Remarks: ${remarks || 'None'}.`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Release request updated to status '${action}'.`,
      status: action
    });
  } catch (err) {
    next(err);
  }
});

export default router;
