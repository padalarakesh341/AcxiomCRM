const FollowUpService = require('../../application/followUpService');
const AuditService = require('../../cross-cutting/auditService');

class FollowUpApiController {
  static list(req, res, next) {
    try {
      const { search, status, type, entityType, filterRange, page = 1, limit = 10 } = req.query;
      const result = FollowUpService.listFollowUps({
        search,
        status,
        type,
        entityType,
        filterRange,
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
      const followUp = FollowUpService.getFollowUpDetails(id, req.user);
      if (!followUp) {
        return res.status(404).json({ success: false, error: { message: 'Follow-up not found.' } });
      }
      return res.status(200).json({ success: true, data: followUp });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.createFollowUp(req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(201).json({ success: true, message: 'Follow-up scheduled successfully.', data: result.followUp });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.updateFollowUp(id, req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Follow-up updated successfully.', data: result.followUp });
    } catch (err) {
      next(err);
    }
  }

  static markCompleted(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.markCompleted(id, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Follow-up marked as completed.' });
    } catch (err) {
      next(err);
    }
  }

  static reschedule(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { newDate, notes } = req.body;
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.reschedule(id, newDate, notes, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Follow-up rescheduled successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.deleteFollowUp(id, req.user, ipAddress);
      if (!result.success) {
        return res.status(403).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Follow-up deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FollowUpApiController;
