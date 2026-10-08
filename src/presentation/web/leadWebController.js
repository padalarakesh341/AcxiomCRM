const LeadService = require('../../application/leadService');
const UserRepository = require('../../data-access/userRepository');
const AuditService = require('../../cross-cutting/auditService');

class LeadWebController {
  static list(req, res, next) {
    try {
      const { search = '', status = '', priority = '', source = '', page = 1 } = req.query;
      const data = LeadService.listLeads({
        search,
        status,
        priority,
        source,
        currentUser: req.session.user,
        page: parseInt(page, 10),
        limit: 10
      });

      return res.render('leads/index', {
        title: 'Lead Management',
        currentUser: req.session.user,
        leads: data.leads,
        pagination: data.pagination,
        search,
        status,
        priority,
        source,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static showCreateForm(req, res) {
    const executives = UserRepository.getSalesExecutives();
    return res.render('leads/form', {
      title: 'New Lead',
      currentUser: req.session.user,
      lead: {},
      isEdit: false,
      executives,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.createLead(req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect('/leads/new');
      }

      req.flash('success', `Lead "${result.lead.title}" created successfully.`);
      return res.redirect(`/leads/${result.lead.id}`);
    } catch (err) {
      next(err);
    }
  }

  static showEditForm(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const details = LeadService.getLeadDetails(id, req.session.user);
      if (!details) {
        req.flash('error', 'Lead not found.');
        return res.redirect('/leads');
      }

      const executives = UserRepository.getSalesExecutives();
      return res.render('leads/form', {
        title: `Edit Lead - ${details.lead.title}`,
        currentUser: req.session.user,
        lead: details.lead,
        isEdit: true,
        executives,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.updateLead(id, req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/leads/${id}/edit`);
      }

      req.flash('success', 'Lead updated successfully.');
      return res.redirect(`/leads/${id}`);
    } catch (err) {
      next(err);
    }
  }

  static showDetails(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const details = LeadService.getLeadDetails(id, req.session.user);
      if (!details) {
        req.flash('error', 'Lead not found.');
        return res.redirect('/leads');
      }

      return res.render('leads/details', {
        title: `Lead: ${details.lead.title}`,
        currentUser: req.session.user,
        lead: details.lead,
        activities: details.activities,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static convert(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.convertLead(id, req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/leads/${id}`);
      }

      req.flash('success', `Lead converted! Created Customer "${result.customer.name}"` + (result.opportunity ? ` and Opportunity "${result.opportunity.name}".` : '.'));
      return res.redirect(`/customers/${result.customer.id}`);
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = LeadService.deleteLead(id, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/leads/${id}`);
      }

      req.flash('success', 'Lead deleted successfully.');
      return res.redirect('/leads');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LeadWebController;
