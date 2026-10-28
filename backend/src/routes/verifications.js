import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

// GET /api/verifications - Queue of records pending review or assigned to current officer
router.get('/', authenticate, requireRole('SUPER_ADMIN', 'VERIFICATION_OFFICER'), async (req, res, next) => {
  try {
    const { status, priority, filterAssigned } = req.query;

    let sql = `
      SELECT f.*,
             i.name as institution_name,
             i.institution_code,
             i.state as institution_state,
             vt.id as task_id,
             vt.priority as task_priority,
             vt.due_date as task_due_date,
             vt.status as task_status,
             vt.notes as task_notes,
             u.full_name as assigned_officer_name,
             (SELECT COUNT(*) FROM documents d WHERE d.fdr_id = f.id) as document_count
      FROM fdr_records f
      JOIN institutions i ON f.institution_id = i.id
      LEFT JOIN verification_tasks vt ON vt.fdr_id = f.id AND vt.status != 'Completed'
      LEFT JOIN users u ON f.assigned_officer_id = u.id
      WHERE f.status IN ('Submitted', 'Resubmitted', 'Under Review', 'Under Verification', 'Clarification Required', 'Additional Documents Required', 'Pending Admin Approval')
    `;
    const params = [];

    // If Verification Officer and filterAssigned is 'me' or default
    if (req.user.role === 'VERIFICATION_OFFICER' && filterAssigned !== 'all') {
      sql += ' AND (f.assigned_officer_id = ? OR f.assigned_officer_id IS NULL)';
      params.push(req.user.id);
    }

    if (status && status !== 'All') {
      sql += ' AND f.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All') {
      sql += ' AND vt.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY CASE WHEN f.discrepancy_flag = 1 THEN 0 ELSE 1 END, f.created_at ASC';

    const records = await db.query(sql, params);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// POST /api/verifications/:id/assign - Super Admin assigns verification task to an officer
router.post('/:id/assign', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { officer_id, priority = 'Medium', due_date, notes } = req.body;

    if (!officer_id) {
      return res.status(400).json({ success: false, message: 'Verification officer must be selected.' });
    }

    const fdrs = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (fdrs.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const fdr = fdrs[0];

    // Check officer exists and is active
    const officers = await db.query('SELECT id, full_name, email FROM users WHERE id = ? AND role = "VERIFICATION_OFFICER"', [officer_id]);
    if (officers.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected user is not an active verification officer.' });
    }
    const officer = officers[0];

    // Update FDR record
    const newStatus = fdr.status === 'Submitted' || fdr.status === 'Draft' ? 'Under Verification' : fdr.status;
    await db.execute(
      'UPDATE fdr_records SET assigned_officer_id = ?, status = ? WHERE id = ?',
      [officer_id, newStatus, id]
    );

    // Create / update verification task
    await db.execute(
      `INSERT INTO verification_tasks (fdr_id, assigned_to, assigned_by, priority, due_date, status, notes)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [id, officer_id, req.user.id, priority, due_date || null, notes || null]
    );

    // Record in history
    await db.execute(
      `INSERT INTO verification_history (fdr_id, previous_status, new_status, action_by, findings)
       VALUES (?, ?, ?, ?, ?)`,
      [id, fdr.status, newStatus, req.user.id, `Assigned to verification officer ${officer.full_name}. Priority: ${priority}.`]
    );

    // Notify officer
    await createNotification({
      userId: officer_id,
      title: 'New FDR Verification Assignment',
      message: `You have been assigned to verify deposit #${id} (${fdr.fdr_number || 'Deposit'}). Priority: ${priority}.`,
      type: 'VERIFICATION_ASSIGNMENT',
      linkUrl: `/verifications/${id}`
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'VERIFICATION_ASSIGNED',
      entityType: 'FDR',
      entityId: id,
      summary: `Assigned FDR #${id} to Officer ${officer.full_name} (${officer.email}).`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `FDR #${id} successfully assigned to ${officer.full_name}.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/verifications/:id/decision - Officer records outcome: 'Verified', 'Pending Admin Approval', 'Approved', or 'Rejected'
router.post('/:id/decision', authenticate, requireRole('SUPER_ADMIN', 'VERIFICATION_OFFICER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, findings, independent_evidence_ref } = req.body;

    const allowedDecisions = ['Verified', 'Pending Admin Approval', 'Approved', 'Rejected'];
    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({ success: false, message: `Decision must be one of: ${allowedDecisions.join(', ')}.` });
    }

    if (!findings || findings.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Detailed verification findings must be recorded.' });
    }

    const fdrs = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (fdrs.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const fdr = fdrs[0];

    // Prevent unauthorized users from approving their own submissions
    if (fdr.created_by && fdr.created_by === req.user.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Conflict of Interest: You cannot approve your own record submission.' });
    }

    // Set verification status label
    let verifLabel = (decision === 'Verified' || decision === 'Approved' || decision === 'Pending Admin Approval')
      ? 'Independently Verified'
      : 'Manual Verification Required';

    await db.execute(
      `UPDATE fdr_records 
       SET status = ?, verification_status_label = ?, 
           discrepancy_flag = ?, discrepancy_details = ?
       WHERE id = ?`,
      [decision, verifLabel, decision === 'Rejected' ? 1 : 0, decision === 'Rejected' ? findings : null, id]
    );

    // Mark active tasks as Completed
    await db.execute(`UPDATE verification_tasks SET status = 'Completed' WHERE fdr_id = ?`, [id]);

    // Record in history
    await db.execute(
      `INSERT INTO verification_history (fdr_id, previous_status, new_status, action_by, findings, decision, independent_evidence_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, fdr.status, decision, req.user.id, findings, decision, independent_evidence_ref || null]
    );

    // Notify Institution
    const instUsers = await db.query('SELECT id FROM users WHERE institution_id = ?', [fdr.institution_id]);
    for (const u of instUsers) {
      await createNotification({
        userId: u.id,
        institutionId: fdr.institution_id,
        title: `Deposit Record Status: ${decision}`,
        message: decision === 'Rejected'
          ? `Your deposit record #${id} (${fdr.fdr_number || 'Deposit'}) was rejected. Reason: ${findings}`
          : `Your deposit record #${id} (${fdr.fdr_number || 'Deposit'}) has been evaluated: ${decision}. Ref: ${independent_evidence_ref || 'Official AICTE Lien Registry'}.`,
        type: decision === 'Rejected' ? 'VERIFICATION_REJECTED' : 'VERIFICATION_COMPLETED',
        linkUrl: `/fdr/${id}`
      });
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `FDR_${decision.toUpperCase().replace(/\s+/g, '_')}`,
      entityType: 'FDR',
      entityId: id,
      summary: `Verification Officer recorded outcome: ${decision}. Findings: ${findings}. Evidence Ref: ${independent_evidence_ref || 'None'}.`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Deposit record marked as ${decision}. Audit trail updated.`,
      status: decision
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/verifications/:id/request-documents - Officer requests clarification or missing docs
router.post('/:id/request-documents', authenticate, requireRole('SUPER_ADMIN', 'VERIFICATION_OFFICER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, requestedDocumentTypes } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please specify the exact document(s) and clarification required.' });
    }

    const fdrs = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (fdrs.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const fdr = fdrs[0];

    await db.execute(
      `UPDATE fdr_records 
       SET status = 'Clarification Required',
           verification_status_label = 'Clarification Requested',
           discrepancy_details = ?
       WHERE id = ?`,
      [`Clarification Required: ${reason}`, id]
    );

    // Record in history
    await db.execute(
      `INSERT INTO verification_history (fdr_id, previous_status, new_status, action_by, findings, decision)
       VALUES (?, ?, 'Clarification Required', ?, ?, 'Requested Documents')`,
      [id, fdr.status, req.user.id, reason]
    );

    // Notify institution
    const instUsers = await db.query('SELECT id FROM users WHERE institution_id = ?', [fdr.institution_id]);
    for (const u of instUsers) {
      await createNotification({
        userId: u.id,
        institutionId: fdr.institution_id,
        title: 'Action Required: Clarification & Supporting Documents Requested',
        message: `Officer requested clarification for deposit #${id}: ${reason}`,
        type: 'MISSING_DOCUMENT',
        linkUrl: `/fdr/${id}`
      });
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CLARIFICATION_REQUESTED',
      entityType: 'FDR',
      entityId: id,
      summary: `Officer requested clarification for FDR #${id}: ${reason}`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Correction request dispatched to institution.',
      status: 'Clarification Required'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/verifications/:id/admin-approve - Super Admin grants final approval or returns application
router.post('/:id/admin-approve', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'Approved' or 'Clarification Required'

    if (!['Approved', 'Clarification Required'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'Approved' or 'Clarification Required'." });
    }

    const fdrs = await db.query('SELECT * FROM fdr_records WHERE id = ?', [id]);
    if (fdrs.length === 0) {
      return res.status(404).json({ success: false, message: 'FDR record not found.' });
    }

    const fdr = fdrs[0];

    await db.execute(
      `UPDATE fdr_records 
       SET status = ?, verification_status_label = ?, discrepancy_details = ?
       WHERE id = ?`,
      [
        action,
        action === 'Approved' ? 'Statutory AICTE Approved' : 'Clarification Requested by Admin',
        action === 'Clarification Required' ? remarks : fdr.discrepancy_details,
        id
      ]
    );

    await db.execute(
      `INSERT INTO verification_history (fdr_id, previous_status, new_status, action_by, findings, decision)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, fdr.status, action, req.user.id, remarks || `Final Administrative Decision: ${action}`, action]
    );

    // Notify institution
    const instUsers = await db.query('SELECT id FROM users WHERE institution_id = ?', [fdr.institution_id]);
    for (const u of instUsers) {
      await createNotification({
        userId: u.id,
        institutionId: fdr.institution_id,
        title: `AICTE Final Approval Status: ${action}`,
        message: action === 'Approved'
          ? `Deposit record #${id} (${fdr.fdr_number || 'Deposit'}) has received final AICTE Administrative Approval.`
          : `Admin returned deposit record #${id} for clarification: ${remarks}`,
        type: action === 'Approved' ? 'FINAL_APPROVAL' : 'CLARIFICATION_REQUIRED',
        linkUrl: `/fdr/${id}`
      });
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `ADMIN_FDR_${action.toUpperCase().replace(/\s+/g, '_')}`,
      entityType: 'FDR',
      entityId: id,
      summary: `Super Admin executed final decision: ${action}. Remarks: ${remarks || 'None'}.`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `FDR record status updated to '${action}'.`,
      status: action
    });
  } catch (err) {
    next(err);
  }
});

export default router;
