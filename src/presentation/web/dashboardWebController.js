const { getDatabase } = require('../../database/db');
const OpportunityRepository = require('../../data-access/opportunityRepository');
const FollowUpRepository = require('../../data-access/followUpRepository');
const AuditRepository = require('../../data-access/auditRepository');

class DashboardWebController {
  static showDashboard(req, res, next) {
    try {
      const db = getDatabase();
      const user = req.session.user;
      const role = user.role_name || user.role;
      const dateFilter = req.query.range || 'month';

      // Date range SQL conditions
      let dateCondition = "";
      if (dateFilter === 'today') {
        dateCondition = "date(created_at) = date('now')";
      } else if (dateFilter === 'week') {
        dateCondition = "date(created_at) >= date('now', '-7 days')";
      } else if (dateFilter === 'month') {
        dateCondition = "date(created_at) >= date('now', '-30 days')";
      } else {
        dateCondition = "1=1";
      }

      let kpiData = {};
      let chartData = {};
      let upcomingFollowUps = [];
      let overdueFollowUps = [];

      if (role === 'Admin') {
        const totalUsers = db.prepare(`SELECT COUNT(*) as count FROM users`).get().count;
        const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers`).get().count;
        const totalLeads = db.prepare(`SELECT COUNT(*) as count FROM leads`).get().count;
        const totalOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities`).get().count;
        const totalPipeline = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE stage NOT IN ('Lost')`).get().total;
        const secStats = AuditRepository.getSecurityStats();
        const recentAudit = AuditRepository.findAll({ limit: 6 });

        kpiData = {
          totalUsers,
          totalCustomers,
          totalLeads,
          totalOpportunities,
          totalPipeline,
          activeUsers: secStats.activeUsersCount,
          lockedUsers: secStats.lockedCount,
          loginFailures: secStats.loginFailedCount
        };

        chartData = {
          pipelineStages: OpportunityRepository.getPipelineSummary(),
          recentAudit
        };
      } else if (role === 'Manager') {
        const teamCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers`).get().count;
        const teamLeads = db.prepare(`SELECT COUNT(*) as count FROM leads`).get().count;
        const openOpps = db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE stage NOT IN ('Won', 'Lost')`).get().count;
        const teamPipeline = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE stage NOT IN ('Lost')`).get().total;
        const weightedPipeline = db.prepare(`SELECT COALESCE(SUM(ROUND(amount * probability / 100.0, 2)), 0) as total FROM opportunities WHERE stage NOT IN ('Lost')`).get().total;
        const wonOpps = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as sum FROM opportunities WHERE stage = 'Won'`).get();

        const teamMembers = db.prepare(`
          SELECT u.id, u.full_name,
                 (SELECT COUNT(*) FROM leads WHERE assigned_user_id = u.id) as leads_count,
                 (SELECT COUNT(*) FROM opportunities WHERE owner_user_id = u.id) as opps_count,
                 (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE owner_user_id = u.id AND stage = 'Won') as won_amount
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE r.name IN ('Sales Executive', 'Manager') AND u.is_active = 1
        `).all();

        kpiData = {
          teamCustomers,
          teamLeads,
          openOpps,
          teamPipeline,
          weightedPipeline,
          wonCount: wonOpps.count,
          wonSum: wonOpps.sum
        };

        chartData = {
          pipelineStages: OpportunityRepository.getPipelineSummary(),
          teamMembers
        };
      } else {
        // Sales Executive Dashboard
        const myCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers WHERE assigned_user_id = ?`).get(user.id).count;
        const myLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE assigned_user_id = ?`).get(user.id).count;
        const myOpenOpps = db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE owner_user_id = ? AND stage NOT IN ('Won', 'Lost')`).get(user.id).count;
        const myPipeline = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE owner_user_id = ? AND stage NOT IN ('Lost')`).get(user.id).total;
        const myWeighted = db.prepare(`SELECT COALESCE(SUM(ROUND(amount * probability / 100.0, 2)), 0) as total FROM opportunities WHERE owner_user_id = ? AND stage NOT IN ('Lost')`).get(user.id).total;
        const myWon = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as sum FROM opportunities WHERE owner_user_id = ? AND stage = 'Won'`).get(user.id);

        const followUpAlerts = FollowUpRepository.getUpcomingAndOverdue(user.id, 5);
        upcomingFollowUps = followUpAlerts.upcoming;
        overdueFollowUps = followUpAlerts.overdue;

        kpiData = {
          myCustomers,
          myLeads,
          myOpenOpps,
          myPipeline,
          myWeighted,
          wonCount: myWon.count,
          wonSum: myWon.sum
        };

        chartData = {
          pipelineStages: OpportunityRepository.getPipelineSummary(user.id)
        };
      }

      // Quick distribution for charts across all roles
      const leadStatusDist = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM leads 
        ${role === 'Sales Executive' ? 'WHERE assigned_user_id = ' + user.id : ''} 
        GROUP BY status
      `).all();

      return res.render('dashboard/index', {
        title: `${role} Dashboard`,
        currentUser: user,
        role,
        dateFilter,
        kpiData,
        chartData,
        leadStatusDist,
        upcomingFollowUps,
        overdueFollowUps,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardWebController;
