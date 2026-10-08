const express = require('express');
const router = express.Router();

const AuthWebController = require('../presentation/web/authWebController');
const DashboardWebController = require('../presentation/web/dashboardWebController');
const CustomerWebController = require('../presentation/web/customerWebController');
const LeadWebController = require('../presentation/web/leadWebController');
const OpportunityWebController = require('../presentation/web/opportunityWebController');
const FollowUpWebController = require('../presentation/web/followUpWebController');
const UserWebController = require('../presentation/web/userWebController');
const AuditWebController = require('../presentation/web/auditWebController');
const ReportWebController = require('../presentation/web/reportWebController');

const { requireWebAuth } = require('../security/authMiddleware');
const { requireAdmin, requireManagerOrAdmin } = require('../security/rbacMiddleware');

// Public Auth Routes
router.get('/auth/login', AuthWebController.showLogin);
router.post('/auth/login', AuthWebController.postLogin);
router.post('/auth/logout', AuthWebController.postLogout);

// Authenticated Root & Profile
router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/dashboard', requireWebAuth, DashboardWebController.showDashboard);
router.get('/profile', requireWebAuth, AuthWebController.showProfile);
router.post('/profile/change-password', requireWebAuth, AuthWebController.postChangePassword);

// Customers
router.get('/customers', requireWebAuth, CustomerWebController.list);
router.get('/customers/new', requireWebAuth, CustomerWebController.showCreateForm);
router.post('/customers', requireWebAuth, CustomerWebController.create);
router.get('/customers/:id', requireWebAuth, CustomerWebController.showDetails);
router.get('/customers/:id/edit', requireWebAuth, CustomerWebController.showEditForm);
router.post('/customers/:id/edit', requireWebAuth, CustomerWebController.update);
router.post('/customers/:id/delete', requireWebAuth, requireManagerOrAdmin, CustomerWebController.delete);

// Leads
router.get('/leads', requireWebAuth, LeadWebController.list);
router.get('/leads/new', requireWebAuth, LeadWebController.showCreateForm);
router.post('/leads', requireWebAuth, LeadWebController.create);
router.get('/leads/:id', requireWebAuth, LeadWebController.showDetails);
router.get('/leads/:id/edit', requireWebAuth, LeadWebController.showEditForm);
router.post('/leads/:id/edit', requireWebAuth, LeadWebController.update);
router.post('/leads/:id/convert', requireWebAuth, LeadWebController.convert);
router.post('/leads/:id/delete', requireWebAuth, requireManagerOrAdmin, LeadWebController.delete);

// Opportunities
router.get('/opportunities', requireWebAuth, OpportunityWebController.list);
router.get('/opportunities/kanban', requireWebAuth, OpportunityWebController.showKanban);
router.get('/opportunities/new', requireWebAuth, OpportunityWebController.showCreateForm);
router.post('/opportunities', requireWebAuth, OpportunityWebController.create);
router.get('/opportunities/:id/edit', requireWebAuth, OpportunityWebController.showEditForm);
router.post('/opportunities/:id/edit', requireWebAuth, OpportunityWebController.update);
router.post('/opportunities/:id/stage', requireWebAuth, OpportunityWebController.updateStage);
router.post('/opportunities/:id/delete', requireWebAuth, requireManagerOrAdmin, OpportunityWebController.delete);

// Follow-Ups
router.get('/followups', requireWebAuth, FollowUpWebController.list);
router.get('/followups/new', requireWebAuth, FollowUpWebController.showCreateForm);
router.post('/followups', requireWebAuth, FollowUpWebController.create);
router.post('/followups/:id/complete', requireWebAuth, FollowUpWebController.markCompleted);
router.post('/followups/:id/reschedule', requireWebAuth, FollowUpWebController.reschedule);
router.post('/followups/:id/delete', requireWebAuth, requireManagerOrAdmin, FollowUpWebController.delete);

// Users (Admin Only)
router.get('/users', requireWebAuth, requireAdmin, UserWebController.list);
router.get('/users/new', requireWebAuth, requireAdmin, UserWebController.showCreateForm);
router.post('/users', requireWebAuth, requireAdmin, UserWebController.create);
router.get('/users/:id/edit', requireWebAuth, requireAdmin, UserWebController.showEditForm);
router.post('/users/:id/edit', requireWebAuth, requireAdmin, UserWebController.update);
router.post('/users/:id/reset-password', requireWebAuth, requireAdmin, UserWebController.resetPassword);
router.post('/users/:id/unlock', requireWebAuth, requireAdmin, UserWebController.unlock);
router.post('/users/:id/toggle-status', requireWebAuth, requireAdmin, UserWebController.toggleStatus);

// Audit Trail (Admin Only)
router.get('/audit', requireWebAuth, requireAdmin, AuditWebController.list);

// Reports (All Roles)
router.get('/reports', requireWebAuth, ReportWebController.index);
router.get('/reports/export/:type', requireWebAuth, ReportWebController.exportCsv);

module.exports = router;
