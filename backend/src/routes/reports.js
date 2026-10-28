import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/dashboard-stats - Live database-computed dashboard stats per role
router.get('/dashboard-stats', authenticate, async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'SUPER_ADMIN') {
      // 1. Total Registered Institutions
      const instCountRes = await db.query('SELECT COUNT(*) as total FROM institutions');
      const totalInstitutions = instCountRes[0].total || 0;

      // 2. Total FDR Records & Total Deposit Value
      const fdrTotalsRes = await db.query(`
        SELECT COUNT(*) as total_fdrs,
               COALESCE(SUM(deposit_amount), 0) as total_deposit_value,
               COUNT(CASE WHEN status IN ('Submitted', 'Resubmitted', 'Under Review', 'Additional Documents Required') THEN 1 END) as pending_verification,
               COUNT(CASE WHEN status = 'Verified' THEN 1 END) as verified_records,
               COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_records,
               COUNT(CASE WHEN discrepancy_flag = 1 THEN 1 END) as discrepancy_count
        FROM fdr_records
      `);
      const fdrStats = fdrTotalsRes[0];

      // 3. Upcoming Maturities within 30 days
      const maturityRes = await db.query(`
        SELECT COUNT(*) as upcoming_maturities
        FROM fdr_records
        WHERE status = 'Verified' AND maturity_date >= date('now') AND maturity_date <= date('now', '+30 days')
      `);
      const upcomingMaturities = maturityRes[0].upcoming_maturities || 0;

      // 4. Pending Release Requests
      const releaseRes = await db.query(`
        SELECT COUNT(*) as pending_releases
        FROM release_requests
        WHERE status NOT IN ('Approved', 'Rejected', 'Released')
      `);
      const pendingReleaseRequests = releaseRes[0].pending_releases || 0;

      // 5. Overdue verification tasks
      const overdueRes = await db.query(`
        SELECT COUNT(*) as overdue_tasks
        FROM verification_tasks
        WHERE status != 'Completed' AND due_date IS NOT NULL AND due_date < date('now')
      `);
      const overdueTasks = overdueRes[0].overdue_tasks || 0;

      // 6. FDR Status Distribution Chart
      const statusDistribution = await db.query(`
        SELECT status as name, COUNT(*) as value
        FROM fdr_records
        GROUP BY status
      `);

      // 7. Institution-wise Deposit Values (Top 6)
      const institutionWiseChart = await db.query(`
        SELECT i.name, COALESCE(SUM(f.deposit_amount), 0) as total_amount, COUNT(f.id) as fdr_count
        FROM institutions i
        LEFT JOIN fdr_records f ON f.institution_id = i.id
        GROUP BY i.id
        ORDER BY total_amount DESC
        LIMIT 6
      `);

      // 8. Maturity Timeline Buckets
      const maturityBuckets = [
        { bucket: 'Matured / Overdue', count: 0 },
        { bucket: '0 - 15 Days', count: 0 },
        { bucket: '16 - 30 Days', count: 0 },
        { bucket: '31 - 90 Days', count: 0 },
        { bucket: '> 90 Days', count: 0 }
      ];

      const allActiveFdrs = await db.query(`SELECT maturity_date FROM fdr_records WHERE status = 'Verified'`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const f of allActiveFdrs) {
        const m = new Date(f.maturity_date);
        m.setHours(0, 0, 0, 0);
        const days = Math.round((m - today) / (1000 * 60 * 60 * 24));
        if (days < 0) maturityBuckets[0].count++;
        else if (days <= 15) maturityBuckets[1].count++;
        else if (days <= 30) maturityBuckets[2].count++;
        else if (days <= 90) maturityBuckets[3].count++;
        else maturityBuckets[4].count++;
      }

      // 9. Recent Activity
      const recentAudit = await db.query(`
        SELECT id, user_email, user_role, action, entity_type, entity_id, change_summary, created_at
        FROM audit_logs
        ORDER BY created_at DESC LIMIT 8
      `);

      // 10. Pending Officer Recommendations & Submissions for Admin Oversight
      const pendingApprovalList = await db.query(`
        SELECT f.id, f.fdr_number, f.deposit_amount, f.bank_name, f.maturity_date, f.status,
               i.name as institution_name, i.institution_code,
               u.full_name as officer_name
        FROM fdr_records f
        JOIN institutions i ON f.institution_id = i.id
        LEFT JOIN users u ON f.assigned_officer_id = u.id
        WHERE f.status IN ('Pending Admin Approval', 'Submitted', 'Under Verification', 'Resubmitted')
        ORDER BY CASE WHEN f.status = 'Pending Admin Approval' THEN 0 ELSE 1 END, f.updated_at DESC
        LIMIT 6
      `);

      // 11. Pending Release Requests
      const pendingReleaseList = await db.query(`
        SELECT r.id, r.request_reference, r.request_date, r.status, r.reason_for_release,
               f.fdr_number, f.deposit_amount,
               i.name as institution_name, i.institution_code
        FROM release_requests r
        JOIN fdr_records f ON r.fdr_id = f.id
        JOIN institutions i ON r.institution_id = i.id
        WHERE r.status NOT IN ('Released', 'Rejected')
        ORDER BY r.created_at DESC
        LIMIT 5
      `);

      return res.json({
        success: true,
        stats: {
          totalInstitutions,
          totalFdrs: fdrStats.total_fdrs,
          totalDepositValue: fdrStats.total_deposit_value,
          pendingVerification: fdrStats.pending_verification,
          verifiedRecords: fdrStats.verified_records,
          rejectedRecords: fdrStats.rejected_records,
          discrepancyCount: fdrStats.discrepancy_count,
          upcomingMaturities,
          pendingReleaseRequests,
          overdueTasks
        },
        charts: {
          statusDistribution,
          institutionWiseChart,
          maturityBuckets
        },
        pendingApprovalList,
        pendingReleaseList,
        recentActivity: recentAudit
      });
    }

    if (role === 'VERIFICATION_OFFICER') {
      // Verification Officer Stats
      const officerId = req.user.id;

      // 1. Assigned tasks & Pending verification
      const tasksRes = await db.query(`
        SELECT COUNT(*) as assigned_tasks,
               COUNT(CASE WHEN status != 'Completed' THEN 1 END) as pending_tasks,
               COUNT(CASE WHEN priority = 'High' AND status != 'Completed' THEN 1 END) as high_priority_tasks,
               COUNT(CASE WHEN status != 'Completed' AND due_date < date('now') THEN 1 END) as overdue_tasks
        FROM verification_tasks
        WHERE assigned_to = ?
      `, [officerId]);

      // Count of all FDRs pending verification
      const pendingFdrRes = await db.query(`
        SELECT COUNT(*) as pending_count
        FROM fdr_records
        WHERE status IN ('Submitted', 'Under Review', 'Under Verification', 'Resubmitted')
      `);

      // 2. Discrepancy cases assigned
      const discrepancyRes = await db.query(`
        SELECT COUNT(*) as discrepancy_cases
        FROM fdr_records
        WHERE (assigned_officer_id = ? OR assigned_officer_id IS NULL) AND discrepancy_flag = 1
      `, [officerId]);

      // 3. Clarification Required / Additional docs required
      const missingDocsRes = await db.query(`
        SELECT COUNT(*) as missing_docs_cases
        FROM fdr_records
        WHERE status IN ('Additional Documents Required', 'Clarification Required')
      `);

      // 4. Verified FDRs count
      const verifiedFdrRes = await db.query(`
        SELECT COUNT(*) as verified_count
        FROM fdr_records
        WHERE status IN ('Verified', 'Approved', 'Statutory AICTE Approved', 'Independently Verified')
      `);

      // 5. Pending Release Reviews
      const pendingReleaseRes = await db.query(`
        SELECT COUNT(*) as pending_release_count
        FROM release_requests
        WHERE status NOT IN ('Released', 'Rejected', 'Approved')
      `);

      // 6. Recently reviewed records by officer
      const recentReviewed = await db.query(`
        SELECT f.id, f.fdr_number, f.bank_name, f.deposit_amount, f.status, i.name as institution_name, vh.created_at, vh.decision
        FROM verification_history vh
        JOIN fdr_records f ON vh.fdr_id = f.id
        JOIN institutions i ON f.institution_id = i.id
        WHERE vh.action_by = ?
        ORDER BY vh.created_at DESC LIMIT 6
      `, [officerId]);

      // 7. Active Queue for this officer
      const activeQueue = await db.query(`
        SELECT f.id, f.fdr_number, f.deposit_amount, f.bank_name, f.status, f.discrepancy_flag, 
               vt.priority, vt.due_date, i.name as institution_name
        FROM fdr_records f
        JOIN institutions i ON f.institution_id = i.id
        LEFT JOIN verification_tasks vt ON vt.fdr_id = f.id AND vt.status != 'Completed'
        WHERE f.status IN ('Submitted', 'Under Review', 'Under Verification', 'Resubmitted', 'Additional Documents Required', 'Clarification Required')
        ORDER BY CASE WHEN f.discrepancy_flag = 1 THEN 0 ELSE 1 END, vt.due_date ASC
        LIMIT 10
      `);

      return res.json({
        success: true,
        stats: {
          assignedTasks: tasksRes[0].assigned_tasks,
          pendingTasks: pendingFdrRes[0].pending_count || tasksRes[0].pending_tasks,
          pendingVerification: pendingFdrRes[0].pending_count || 0,
          clarificationRequired: missingDocsRes[0].missing_docs_cases || 0,
          verifiedFdrs: verifiedFdrRes[0].verified_count || 0,
          pendingReleaseReviews: pendingReleaseRes[0].pending_release_count || 0,
          highPriorityTasks: tasksRes[0].high_priority_tasks,
          overdueTasks: tasksRes[0].overdue_tasks,
          discrepancyCases: discrepancyRes[0].discrepancy_cases,
          missingDocsCases: missingDocsRes[0].missing_docs_cases
        },
        activeQueue,
        recentReviewed
      });
    }

    if (role === 'INSTITUTION_ADMIN') {
      const instId = req.user.institution_id;

      // 1. Institution FDR Stats
      const instStatsRes = await db.query(`
        SELECT COUNT(*) as total_fdrs,
               COALESCE(SUM(deposit_amount), 0) as total_deposit_value,
               COUNT(CASE WHEN status = 'Verified' THEN 1 END) as verified_records,
               COUNT(CASE WHEN status IN ('Submitted', 'Under Review', 'Resubmitted') THEN 1 END) as pending_verification,
               COUNT(CASE WHEN status = 'Additional Documents Required' THEN 1 END) as requires_correction,
               COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_records
        FROM fdr_records
        WHERE institution_id = ?
      `, [instId]);

      // 2. Upcoming Maturities for this institution
      const instMaturities = await db.query(`
        SELECT id, fdr_number, bank_name, deposit_amount, maturity_date
        FROM fdr_records
        WHERE institution_id = ? AND status = 'Verified' AND maturity_date <= date('now', '+60 days')
        ORDER BY maturity_date ASC
      `, [instId]);

      // 3. Release requests count
      const instReleases = await db.query(`
        SELECT COUNT(*) as active_release_requests
        FROM release_requests
        WHERE institution_id = ? AND status NOT IN ('Released', 'Rejected')
      `, [instId]);

      // 4. Notifications
      const recentNotifs = await db.query(`
        SELECT id, title, message, type, link_url, is_read, created_at
        FROM notifications
        WHERE user_id = ? OR institution_id = ?
        ORDER BY created_at DESC LIMIT 5
      `, [req.user.id, instId]);

      return res.json({
        success: true,
        stats: {
          ...instStatsRes[0],
          upcomingMaturitiesCount: instMaturities.length,
          activeReleaseRequests: instReleases[0].active_release_requests,
          profileCompletion: '100%'
        },
        upcomingMaturities: instMaturities,
        recentNotifications: recentNotifs
      });
    }

    res.json({ success: true, stats: {} });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/fdr - Institution-wise FDR records exportable report
router.get('/fdr', authenticate, async (req, res, next) => {
  try {
    const { institution_id, status } = req.query;
    let sql = `
      SELECT f.id, f.fdr_number, f.record_type, f.bank_name, f.branch_name, f.deposit_amount,
             f.currency, f.issue_date, f.maturity_date, f.deposit_holder_name, f.status,
             f.verification_status_label, f.discrepancy_flag, i.name as institution_name,
             i.institution_code, i.state
      FROM fdr_records f
      JOIN institutions i ON f.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'INSTITUTION_ADMIN') {
      sql += ' AND f.institution_id = ?';
      params.push(req.user.institution_id);
    } else if (institution_id && institution_id !== 'All') {
      sql += ' AND f.institution_id = ?';
      params.push(institution_id);
    }

    if (status && status !== 'All') {
      sql += ' AND f.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY f.maturity_date ASC';

    const records = await db.query(sql, params);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/maturities - Upcoming maturities report
router.get('/maturities', authenticate, async (req, res, next) => {
  try {
    const { days = 90 } = req.query;
    let sql = `
      SELECT f.id, f.fdr_number, f.bank_name, f.deposit_amount, f.maturity_date, f.status,
             i.name as institution_name, i.contact_name, i.contact_email, i.contact_phone
      FROM fdr_records f
      JOIN institutions i ON f.institution_id = i.id
      WHERE f.status = 'Verified' AND f.maturity_date <= date('now', '+${parseInt(days, 10)} days')
    `;
    const params = [];

    if (req.user.role === 'INSTITUTION_ADMIN') {
      sql += ' AND f.institution_id = ?';
      params.push(req.user.institution_id);
    }

    sql += ' ORDER BY f.maturity_date ASC';

    const records = await db.query(sql, params);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

export default router;
