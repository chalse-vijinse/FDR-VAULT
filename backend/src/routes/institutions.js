import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// GET /api/institutions - List with search & filtering
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, state, status, category } = req.query;

    // Institution Admins can only view their own institution profile
    if (req.user.role === 'INSTITUTION_ADMIN') {
      const rows = await db.query(
        `SELECT i.*, 
                COUNT(f.id) as total_fdrs,
                COALESCE(SUM(f.deposit_amount), 0) as total_deposit_value
         FROM institutions i
         LEFT JOIN fdr_records f ON f.institution_id = i.id
         WHERE i.id = ?
         GROUP BY i.id`,
        [req.user.institution_id]
      );
      return res.json({ success: true, data: rows });
    }

    // Super Admin & Verification Officer can view all
    let sql = `
      SELECT i.*, 
             COUNT(f.id) as total_fdrs,
             COALESCE(SUM(f.deposit_amount), 0) as total_deposit_value,
             COUNT(CASE WHEN f.status = 'Verified' THEN 1 END) as verified_fdrs,
             COUNT(CASE WHEN f.status IN ('Submitted', 'Under Review', 'Additional Documents Required') THEN 1 END) as pending_fdrs
      FROM institutions i
      LEFT JOIN fdr_records f ON f.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (i.name LIKE ? OR i.institution_code LIKE ? OR i.contact_name LIKE ? OR i.contact_email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (state && state !== 'All') {
      sql += ` AND i.state = ?`;
      params.push(state);
    }

    if (status && status !== 'All') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (category && category !== 'All') {
      sql += ` AND i.category = ?`;
      params.push(category);
    }

    sql += ` GROUP BY i.id ORDER BY i.created_at DESC`;

    const institutions = await db.query(sql, params);
    res.json({ success: true, data: institutions });
  } catch (err) {
    next(err);
  }
});

// GET /api/institutions/:id - Single institution with FDRs and history
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check scope
    if (req.user.role === 'INSTITUTION_ADMIN' && String(req.user.institution_id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot view other institutions.' });
    }

    const insts = await db.query('SELECT * FROM institutions WHERE id = ?', [id]);
    if (insts.length === 0) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    const institution = insts[0];

    // Fetch associated FDRs
    const fdrs = await db.query(
      `SELECT id, record_type, fdr_number, bank_name, deposit_amount, issue_date, maturity_date, status, verification_status_label, discrepancy_flag
       FROM fdr_records 
       WHERE institution_id = ? 
       ORDER BY maturity_date ASC`,
      [id]
    );

    // Fetch associated users
    const users = await db.query(
      `SELECT id, email, full_name, role, designation, phone, status, last_login 
       FROM users 
       WHERE institution_id = ?`,
      [id]
    );

    // Fetch audit history
    const logs = await db.query(
      `SELECT * FROM audit_logs 
       WHERE (entity_type = 'INSTITUTION' AND entity_id = ?) 
          OR user_id IN (SELECT id FROM users WHERE institution_id = ?)
       ORDER BY created_at DESC LIMIT 20`,
      [id, id]
    );

    res.json({
      success: true,
      data: {
        ...institution,
        fdrRecords: fdrs,
        authorizedUsers: users,
        auditHistory: logs
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions - Register institution (Super Admin)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { institution_code, name, category, address, state, district, pincode, contact_name, contact_email, contact_phone } = req.body;

    if (!institution_code || !name || !contact_email) {
      return res.status(400).json({ success: false, message: 'Institution code, name, and contact email are required.' });
    }

    // Check unique code
    const existing = await db.query('SELECT id FROM institutions WHERE institution_code = ?', [institution_code.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An institution with this code already exists.' });
    }

    const result = await db.execute(
      `INSERT INTO institutions (institution_code, name, category, address, state, district, pincode, contact_name, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [institution_code.trim(), name.trim(), category || 'Engineering & Technology', address || '', state || '', district || '', pincode || '', contact_name || '', contact_email.trim(), contact_phone || '']
    );

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'INSTITUTION_CREATED',
      entityType: 'INSTITUTION',
      entityId: result.insertId,
      summary: `Created new educational institution: ${name} (${institution_code}).`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Institution registered successfully.',
      institutionId: result.insertId
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/institutions/:id - Edit institution details
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check scope: Institution admin can only edit contact details of their own institution
    if (req.user.role === 'INSTITUTION_ADMIN' && String(req.user.institution_id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot edit other institutions.' });
    }

    const { name, category, address, state, district, pincode, contact_name, contact_email, contact_phone, status } = req.body;

    // Super Admin can edit all, Institution Admin can update address & contact
    let query;
    let params;

    if (req.user.role === 'SUPER_ADMIN') {
      query = `
        UPDATE institutions 
        SET name = ?, category = ?, address = ?, state = ?, district = ?, pincode = ?, 
            contact_name = ?, contact_email = ?, contact_phone = ?, status = ?
        WHERE id = ?
      `;
      params = [name, category, address, state, district, pincode, contact_name, contact_email, contact_phone, status || 'Active', id];
    } else {
      query = `
        UPDATE institutions 
        SET address = ?, contact_name = ?, contact_email = ?, contact_phone = ?
        WHERE id = ?
      `;
      params = [address, contact_name, contact_email, contact_phone, id];
    }

    await db.execute(query, params);

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'INSTITUTION_UPDATED',
      entityType: 'INSTITUTION',
      entityId: id,
      summary: `Updated institution profile (ID: ${id}).`,
      ip: req.ip
    });

    res.json({ success: true, message: 'Institution profile updated successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
