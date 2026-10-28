import db from '../config/db.js';
import { createNotification } from './notificationService.js';

export async function checkMaturityAlerts() {
  try {
    // Get setting for reminder intervals
    const settings = await db.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'maturity_reminder_intervals'`
    );
    const intervalsStr = settings.length > 0 ? settings[0].setting_value : '30,15,7,0';
    const intervals = intervalsStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

    // Query active verified or pending FDRs
    const fdrs = await db.query(
      `SELECT f.id, f.fdr_number, f.deposit_amount, f.maturity_date, f.institution_id, i.name as inst_name
       FROM fdr_records f
       JOIN institutions i ON f.institution_id = i.id
       WHERE f.status IN ('Verified', 'Under Review', 'Submitted')`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const fdr of fdrs) {
      const matDate = new Date(fdr.maturity_date);
      matDate.setHours(0, 0, 0, 0);
      const diffTime = matDate - today;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      for (const interval of intervals) {
        if (diffDays === interval) {
          // Check if notification already sent in the last 24 hours for this interval
          const notifTitle = interval === 0
            ? `FDR Matured Today: ${fdr.fdr_number || 'Deposit #' + fdr.id}`
            : `Upcoming Maturity Alert (${interval} Days): ${fdr.fdr_number || 'Deposit #' + fdr.id}`;

          const existing = await db.query(
            `SELECT id FROM notifications 
             WHERE institution_id = ? AND title = ? AND created_at >= date('now', '-1 day')`,
            [fdr.institution_id, notifTitle]
          );

          if (existing.length === 0) {
            // Find users belonging to this institution or super admin
            const instUsers = await db.query(
              `SELECT id FROM users WHERE institution_id = ? OR role = 'SUPER_ADMIN'`,
              [fdr.institution_id]
            );

            const amtFormatted = Number(fdr.deposit_amount).toLocaleString('en-IN');
            const msg = interval === 0
              ? `FDR ${fdr.fdr_number} of ₹${amtFormatted} for ${fdr.inst_name} has matured today (${fdr.maturity_date}). Review compliance guidelines for deposit renewal or release eligibility.`
              : `FDR ${fdr.fdr_number} of ₹${amtFormatted} for ${fdr.inst_name} will mature in ${interval} days on ${fdr.maturity_date}.`;

            for (const u of instUsers) {
              await createNotification({
                userId: u.id,
                institutionId: fdr.institution_id,
                title: notifTitle,
                message: msg,
                type: 'MATURITY_ALERT',
                linkUrl: `/fdr/${fdr.id}`
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[MaturityService] Error checking maturity alerts:', err.message);
  }
}

export default {
  checkMaturityAlerts
};
