const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../presentation/api/swagger.json');

const AuthApiController = require('../presentation/api/authApiController');
const CustomerApiController = require('../presentation/api/customerApiController');
const LeadApiController = require('../presentation/api/leadApiController');
const OpportunityApiController = require('../presentation/api/opportunityApiController');
const FollowUpApiController = require('../presentation/api/followUpApiController');
const ReportApiController = require('../presentation/api/reportApiController');

const { requireApiAuth } = require('../security/authMiddleware');
const { requireManagerOrAdmin } = require('../security/rbacMiddleware');

// Swagger API Docs Endpoint
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authentication Endpoints
router.post('/v1/auth/login', AuthApiController.login);
router.get('/v1/auth/me', requireApiAuth, AuthApiController.me);

// Customer Endpoints
router.get('/v1/customers', requireApiAuth, CustomerApiController.list);
router.post('/v1/customers', requireApiAuth, CustomerApiController.create);
router.get('/v1/customers/:id', requireApiAuth, CustomerApiController.getById);
router.put('/v1/customers/:id', requireApiAuth, CustomerApiController.update);
router.delete('/v1/customers/:id', requireApiAuth, requireManagerOrAdmin, CustomerApiController.delete);

// Lead Endpoints
router.get('/v1/leads', requireApiAuth, LeadApiController.list);
router.post('/v1/leads', requireApiAuth, LeadApiController.create);
router.get('/v1/leads/:id', requireApiAuth, LeadApiController.getById);
router.put('/v1/leads/:id', requireApiAuth, LeadApiController.update);
router.post('/v1/leads/:id/convert', requireApiAuth, LeadApiController.convert);
router.delete('/v1/leads/:id', requireApiAuth, requireManagerOrAdmin, LeadApiController.delete);

// Opportunity Endpoints
router.get('/v1/opportunities', requireApiAuth, OpportunityApiController.list);
router.post('/v1/opportunities', requireApiAuth, OpportunityApiController.create);
router.get('/v1/opportunities/:id', requireApiAuth, OpportunityApiController.getById);
router.put('/v1/opportunities/:id', requireApiAuth, OpportunityApiController.update);
router.patch('/v1/opportunities/:id/stage', requireApiAuth, OpportunityApiController.updateStage);
router.delete('/v1/opportunities/:id', requireApiAuth, requireManagerOrAdmin, OpportunityApiController.delete);

// Follow-Up Endpoints
router.get('/v1/follow-ups', requireApiAuth, FollowUpApiController.list);
router.post('/v1/follow-ups', requireApiAuth, FollowUpApiController.create);
router.get('/v1/follow-ups/:id', requireApiAuth, FollowUpApiController.getById);
router.put('/v1/follow-ups/:id', requireApiAuth, FollowUpApiController.update);
router.patch('/v1/follow-ups/:id/complete', requireApiAuth, FollowUpApiController.markCompleted);
router.patch('/v1/follow-ups/:id/reschedule', requireApiAuth, FollowUpApiController.reschedule);
router.delete('/v1/follow-ups/:id', requireApiAuth, requireManagerOrAdmin, FollowUpApiController.delete);

// Reports Endpoints
router.get('/v1/reports/pipeline', requireApiAuth, ReportApiController.pipeline);
router.get('/v1/reports/conversion', requireApiAuth, ReportApiController.conversion);
router.get('/v1/reports/user-activity', requireApiAuth, ReportApiController.userActivity);
router.get('/v1/reports/export/:type', requireApiAuth, ReportApiController.exportCsv);

module.exports = router;
