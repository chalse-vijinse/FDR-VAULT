import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// GET /api/settings - Get system settings
router.get('/', authenticate, async (req, res, next) => {
  try {
    const settings = await db.query('SELECT * FROM system_settings ORDER BY setting_key ASC');
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings - Update system settings (Super Admin only)
router.put('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { settings } = req.body; // array of { setting_key, setting_value }

    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Settings must be provided as an array.' });
    }

    for (const item of settings) {
      if (item.setting_key && item.setting_value !== undefined) {
        await db.execute(
          `UPDATE system_settings 
           SET setting_value = ?, updated_at = datetime('now')
           WHERE setting_key = ?`,
          [String(item.setting_value), item.setting_key]
        );
      }
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SYSTEM_SETTINGS',
      summary: `Super Admin updated ${settings.length} system configuration parameters.`,
      ip: req.ip
    });

    res.json({ success: true, message: 'System settings updated successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
