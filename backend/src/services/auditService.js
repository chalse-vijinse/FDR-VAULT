import db from '../config/db.js';

export async function logAudit({
  userId = null,
  userEmail = null,
  userRole = null,
  action,
  entityType,
  entityId = null,
  summary,
  ip = '127.0.0.1'
}) {
  try {
    await db.execute(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, entity_type, entity_id, change_summary, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, userEmail, userRole, action, entityType, entityId ? String(entityId) : null, summary, ip]
    );
  } catch (err) {
    console.error('[AuditService] Failed to record audit entry:', err.message);
  }
}

export default {
  logAudit
};
