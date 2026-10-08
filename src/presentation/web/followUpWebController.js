const FollowUpService = require('../../application/followUpService');
const CustomerRepository = require('../../data-access/customerRepository');
const LeadRepository = require('../../data-access/leadRepository');
const OpportunityRepository = require('../../data-access/opportunityRepository');
const UserRepository = require('../../data-access/userRepository');
const AuditService = require('../../cross-cutting/auditService');

class FollowUpWebController {
  static list(req, res, next) {
    try {
      const { search = '', status = '', type = '', filterRange = '', page = 1 } = req.query;
      const data = FollowUpService.listFollowUps({
        search,
        status,
        type,
        filterRange,
        currentUser: req.session.user,
        page: parseInt(page, 10),
        limit: 10
      });

      return res.render('followups/index', {
        title: 'Follow-Up Schedule',
        currentUser: req.session.user,
        followUps: data.followUps,
        pagination: data.pagination,
        search,
        status,
        type,
        filterRange,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static showCreateForm(req, res) {
    const customers = CustomerRepository.findAll({ limit: 100 });
    const leads = LeadRepository.findAll({ limit: 100 });
    const opportunities = OpportunityRepository.findAll({ limit: 100 });
    const executives = UserRepository.getSalesExecutives();

    return res.render('followups/form', {
      title: 'Schedule Follow-Up',
      currentUser: req.session.user,
      followUp: {
        entity_type: req.query.entityType || 'Customer',
        entity_id: req.query.entityId || ''
      },
      isEdit: false,
      customers,
      leads,
      opportunities,
      executives,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.createFollowUp(req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect('/followups/new');
      }

      req.flash('success', `Follow-up "${result.followUp.subject}" scheduled.`);
      return res.redirect('/followups');
    } catch (err) {
      next(err);
    }
  }

  static markCompleted(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.markCompleted(id, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', 'Follow-up marked as completed.');
      }

      const returnUrl = req.body.returnUrl || '/followups';
      return res.redirect(returnUrl);
    } catch (err) {
      next(err);
    }
  }

  static reschedule(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { newDate, notes } = req.body;
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.reschedule(id, newDate, notes, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', 'Follow-up successfully rescheduled.');
      }

      return res.redirect('/followups');
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = FollowUpService.deleteFollowUp(id, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', 'Follow-up deleted.');
      }

      return res.redirect('/followups');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FollowUpWebController;
