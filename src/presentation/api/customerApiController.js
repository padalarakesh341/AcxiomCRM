const CustomerService = require('../../application/customerService');
const AuditService = require('../../cross-cutting/auditService');

class CustomerApiController {
  static list(req, res, next) {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;
      const result = CustomerService.listCustomers({
        search,
        status,
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
      const details = CustomerService.getCustomerDetails(id, req.user);
      if (!details) {
        return res.status(404).json({ success: false, error: { message: 'Customer not found.' } });
      }
      return res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  static create(req, res, next) {
    try {
      const ipAddress = AuditService.getClientIp(req);
      const result = CustomerService.createCustomer(req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(201).json({ success: true, message: 'Customer created successfully.', data: result.customer });
    } catch (err) {
      next(err);
    }
  }

  static update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = CustomerService.updateCustomer(id, req.body, req.user, ipAddress);
      if (!result.success) {
        return res.status(400).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Customer updated successfully.', data: result.customer });
    } catch (err) {
      next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const ipAddress = AuditService.getClientIp(req);
      const result = CustomerService.deleteCustomer(id, req.user, ipAddress);
      if (!result.success) {
        return res.status(403).json({ success: false, error: { messages: result.errors } });
      }
      return res.status(200).json({ success: true, message: 'Customer deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerApiController;
