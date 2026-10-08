const LeadService = require('../../application/leadService');
const AuditService = require('../../cross-cutting/auditService');

class LeadApiController {
  static list(req, res, next) {
    try {
      const { search, status, priority, source, page = 1, limit = 10 } = req.query;
      const result = LeadService.listLeads({
        search,
        status,
        priority,
        source,
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
      const details = LeadService.getLeadDetails(id, req.user);
      if (!details) {
        return res.status(404).json({ success: false, error: { message: 'Lead not found.' } });
      }
      return res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.createLead(req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(201).json({ success: true, message: 'Lead created successfully.', data: result.lead });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.updateLead(id, req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Lead updated successfully.', data: result.lead });
    } catch (err) {
      next(err);
    }
  }

  static convert(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.convertLead(id, req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({
        success: true,
        message: 'Lead converted successfully into customer and opportunity.',
        data: {
          customer: result.customer,
          opportunity: result.opportunity
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.deleteLead(id, req.user, ipAddress);
      if (!result.success) {
        return res.status(403).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Lead deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LeadApiController;
