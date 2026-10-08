const OpportunityService = require('../../application/opportunityService');
const CustomerRepository = require('../../data-access/customerRepository');
const UserRepository = require('../../data-access/userRepository');
const AuditService = require('../../cross-cutting/auditService');

class OpportunityWebController {
  static list(req, res, next) {
    try {
      const { search = '', stage = '', page = 1 } = req.query;
      const data = OpportunityService.listOpportunities({
        search,
        stage,
        currentUser: req.session.user,
        page: parseInt(page, 10),
        limit: 10
      });

      return res.render('opportunities/index', {
        title: 'Opportunity Pipeline',
        currentUser: req.session.user,
        opportunities: data.opportunities,
        pagination: data.pagination,
        search,
        stage,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static showKanban(req, res, next) {
    try {
      const columns = OpportunityService.getKanbanData(req.session.user);
      return res.render('opportunities/kanban', {
        title: 'Opportunity Pipeline Kanban',
        currentUser: req.session.user,
        columns,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static showCreateForm(req, res) {
    const customers = CustomerRepository.findAll({ limit: 200 });
    const executives = UserRepository.getSalesExecutives();

    return res.render('opportunities/form', {
      title: 'New Opportunity',
      currentUser: req.session.user,
      opportunity: {},
      isEdit: false,
      customers,
      executives,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.createOpportunity(req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect('/opportunities/new');
      }

      req.flash('success', `Opportunity "${result.opportunity.name}" created successfully.`);
      return res.redirect('/opportunities');
    } catch (err) {
      next(err);
    }
  }

  static showEditForm(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const opportunity = OpportunityService.getOpportunityDetails(id, req.session.user);
      if (!opportunity) {
        req.flash('error', 'Opportunity not found.');
        return res.redirect('/opportunities');
      }

      const customers = CustomerRepository.findAll({ limit: 200 });
      const executives = UserRepository.getSalesExecutives();

      return res.render('opportunities/form', {
        title: `Edit Opportunity - ${opportunity.name}`,
        currentUser: req.session.user,
        opportunity,
        isEdit: true,
        customers,
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
      const result = OpportunityService.updateOpportunity(id, req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/opportunities/${id}/edit`);
      }

      req.flash('success', 'Opportunity updated successfully.');
      return res.redirect('/opportunities');
    } catch (err) {
      next(err);
    }
  }

  static updateStage(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { stage } = req.body;
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.updateStage(id, stage, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', `Opportunity stage updated to "${stage}".`);
      }

      const returnUrl = req.body.returnUrl || '/opportunities';
      return res.redirect(returnUrl);
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = OpportunityService.deleteOpportunity(id, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
      } else {
        req.flash('success', 'Opportunity deleted successfully.');
      }

      return res.redirect('/opportunities');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OpportunityWebController;
