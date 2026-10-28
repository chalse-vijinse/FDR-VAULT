import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - List user's notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;

    let sql = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (unreadOnly === 'true') {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const notifs = await db.query(sql, params);

    const unreadCountRes = await db.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    const unreadCount = unreadCountRes[0].unread_count || unreadCountRes[0]['COUNT(*)'] || 0;

    res.json({
      success: true,
      data: notifs,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

export default router;
