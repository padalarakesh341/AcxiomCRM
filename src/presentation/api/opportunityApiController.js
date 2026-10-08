const OpportunityService = require('../../application/opportunityService');
const AuditService = require('../../cross-cutting/auditService');

class OpportunityApiController {
  static list(req, res, next) {
    try {
      const { search, stage, page = 1, limit = 10 } = req.query;
      const result = OpportunityService.listOpportunities({
        search,
        stage,
        currentUser: req.user,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const opportunity = OpportunityService.getOpportunityDetails(id, req.user);
      if (!opportunity) {
        return res.status(404).json({ success: false, error: { message: 'Opportunity not found.' } });
      }
      return res.status(200).json({ success: true, data: opportunity });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.createOpportunity(req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(201).json({ success: true, message: 'Opportunity created successfully.', data: result.opportunity });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.updateOpportunity(id, req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Opportunity updated successfully.', data: result.opportunity });
    } catch (err) {
      next(err);
    }
  }

  static updateStage(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { stage } = req.body;
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.updateStage(id, stage, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Opportunity stage updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.deleteOpportunity(id, req.user, ipAddress);
      if (!result.success) {
        return res.status(403).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Opportunity deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OpportunityApiController;
