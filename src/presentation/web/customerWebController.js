const CustomerService = require('../../application/customerService');
const UserRepository = require('../../data-access/userRepository');
const AuditService = require('../../cross-cutting/auditService');

class CustomerWebController {
  static list(req, res, next) {
    try {
      const { search = '', status = '', page = 1 } = req.query;
      const data = CustomerService.listCustomers({
        search,
        status,
        currentUser: req.session.user,
        page: parseInt(page, 10),
        limit: 10
      });

      return res.render('customers/index', {
        title: 'Customer Management',
        currentUser: req.session.user,
        customers: data.customers,
        pagination: data.pagination,
        search,
        status,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static showCreateForm(req, res) {
    const executives = UserRepository.getSalesExecutives();
    return res.render('customers/form', {
      title: 'New Customer',
      currentUser: req.session.user,
      customer: {},
      isEdit: false,
      executives,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = CustomerService.createCustomer(req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect('/customers/new');
      }

      req.flash('success', `Customer "${result.customer.name}" created successfully.`);
      return res.redirect(`/customers/${result.customer.id}`);
    } catch (err) {
      next(err);
    }
  }

  static showEditForm(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const details = CustomerService.getCustomerDetails(id, req.session.user);
      if (!details) {
        req.flash('error', 'Customer not found.');
        return res.redirect('/customers');
      }

      const executives = UserRepository.getSalesExecutives();
      return res.render('customers/form', {
        title: `Edit Customer - ${details.customer.name}`,
        currentUser: req.session.user,
        customer: details.customer,
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
      const result = CustomerService.updateCustomer(id, req.body, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/customers/${id}/edit`);
      }

      req.flash('success', 'Customer updated successfully.');
      return res.redirect(`/customers/${id}`);
    } catch (err) {
      next(err);
    }
  }

  static showDetails(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const details = CustomerService.getCustomerDetails(id, req.session.user);
      if (!details) {
        req.flash('error', 'Customer not found.');
        return res.redirect('/customers');
      }

      return res.render('customers/details', {
        title: `Customer: ${details.customer.name}`,
        currentUser: req.session.user,
        customer: details.customer,
        activities: details.activities,
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = CustomerService.deleteCustomer(id, req.session.user, ipAddress);

      if (!result.success) {
        req.flash('error', result.errors.join(' '));
        return res.redirect(`/customers/${id}`);
      }

      req.flash('success', 'Customer deleted successfully.');
      return res.redirect('/customers');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerWebController;
