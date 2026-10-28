import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../config/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await db.query(
      `SELECT u.*, i.name as institution_name, i.institution_code
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const user = users[0];
    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      await logAudit({
        userEmail: email,
        action: 'FAILED_LOGIN_ATTEMPT',
        entityType: 'USER',
        summary: `Failed login attempt with incorrect password for ${email}.`,
        ip: req.ip
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    // Update last_login
    await db.execute(`UPDATE users SET last_login = datetime('now') WHERE id = ?`, [user.id]);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      summary: `User logged in successfully with role ${user.role}.`,
      ip: req.ip
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      institutionId: user.institution_id,
      institutionName: user.institution_name,
      institutionCode: user.institution_code,
      designation: user.designation,
      phone: user.phone
    };

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userPayload
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const users = await db.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.institution_id, u.designation, u.phone, u.status,
              i.name as institution_name, i.institution_code, i.category as institution_category
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = users[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        institutionId: u.institution_id,
        institutionName: u.institution_name,
        institutionCode: u.institution_code,
        institutionCategory: u.institution_category,
        designation: u.designation,
        phone: u.phone,
        status: u.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: req.user.id,
      summary: 'User logged out of session.',
      ip: req.ip
    });

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/switch-demo-user (Instant Demo Switcher for Hackathon Evaluation)
router.post('/switch-demo-user', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email target required for demo switch.' });
    }

    const users = await db.query(
      `SELECT u.*, i.name as institution_name, i.institution_code
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Demo persona not found.' });
    }

    const user = users[0];
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DEMO_ROLE_SWITCH',
      entityType: 'USER',
      entityId: user.id,
      summary: `Evaluator switched persona to ${user.full_name} (${user.role}).`,
      ip: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        institutionId: user.institution_id,
        institutionName: user.institution_name,
        institutionCode: user.institution_code,
        designation: user.designation,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register-request
router.post('/register-request', async (req, res, next) => {
  try {
    const { institutionName, institutionCode, state, district, contactName, contactEmail, contactPhone, category } = req.body;
    if (!institutionName || !contactEmail || !contactName) {
      return res.status(400).json({ success: false, message: 'Institution name, contact name, and email are mandatory.' });
    }

    const code = institutionCode || `INST-REG-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.execute(
      `INSERT INTO institutions (institution_code, name, category, address, state, district, pincode, contact_name, contact_email, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Verification')`,
      [code, institutionName, category || 'Engineering & Technology', 'Pending Address Verification', state || 'Delhi', district || 'Central', '000000', contactName, contactEmail, contactPhone || '']
    );

    await logAudit({
      userEmail: contactEmail,
      action: 'INSTITUTION_REGISTRATION_REQUEST',
      entityType: 'INSTITUTION',
      entityId: result.insertId,
      summary: `New institution registration request submitted: ${institutionName} (${code}).`,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Registration request submitted successfully. Awaiting verification officer authorization.',
      referenceCode: code
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: `If an account exists for ${email}, password reset instructions have been dispatched to the registered institutional contact.`
  });
});

export default router;
