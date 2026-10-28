import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// GET /api/users - List all users (Super Admin only)
router.get('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { role, status, search } = req.query;

    let sql = `
      SELECT u.id, u.email, u.full_name, u.role, u.institution_id, u.designation, u.phone, u.status, u.last_login, u.created_at,
             i.name as institution_name, i.institution_code
      FROM users u
      LEFT JOIN institutions i ON u.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'All') {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    if (status && status !== 'All') {
      sql += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.designation LIKE ? OR i.name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await db.query(sql, params);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create new authorized user (Super Admin)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { email, password, full_name, role, institution_id, designation, phone } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, full name, and role are required.' });
    }

    // Role check
    const validRoles = ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    if (role === 'INSTITUTION_ADMIN' && !institution_id) {
      return res.status(400).json({ success: false, message: 'Institution Admin must be assigned to an active institution.' });
    }

    // Check unique email
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const result = await db.execute(
      `INSERT INTO users (email, password_hash, full_name, role, institution_id, designation, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [email.trim().toLowerCase(), hashed, full_name.trim(), role, institution_id || null, designation || '', phone || '']
    );

    const userId = result.insertId;

    if (institution_id) {
      await db.execute(
        `INSERT INTO institution_user_assignments (user_id, institution_id, role_title)
         VALUES (?, ?, ?)`,
        [userId, institution_id, designation || 'Authorized Signatory']
      );
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: userId,
      summary: `Super Admin created new user account: ${full_name} (${email}, Role: ${role}).`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      userId
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id - Update user details or toggle status
router.put('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role, designation, phone, status, password } = req.body;

    const existing = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const current = existing[0];

    let passwordHash = current.password_hash;
    if (password && password.trim().length >= 6) {
      passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    await db.execute(
      `UPDATE users 
       SET full_name = ?, role = ?, designation = ?, phone = ?, status = ?, password_hash = ?
       WHERE id = ?`,
      [
        full_name || current.full_name,
        role || current.role,
        designation !== undefined ? designation : current.designation,
        phone !== undefined ? phone : current.phone,
        status || current.status,
        passwordHash,
        id
      ]
    );

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      summary: `Updated user account #${id} (${current.email}). Status: ${status || current.status}.`,
      ip: req.ip
    });

    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
