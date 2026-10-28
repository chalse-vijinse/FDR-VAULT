import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

// GET /api/audit-logs - Query audit trail with filtering
router.get('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { action, entityType, search, limit = 100 } = req.query;

    let sql = `
      SELECT id, user_id, user_email, user_role, action, entity_type, entity_id, change_summary, ip_address, created_at
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (action && action !== 'All') {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (entityType && entityType !== 'All') {
      sql += ' AND entity_type = ?';
      params.push(entityType);
    }

    if (search) {
      sql += ' AND (user_email LIKE ? OR change_summary LIKE ? OR entity_id LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const logs = await db.query(sql, params);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
