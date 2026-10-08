const CustomerRepository = require('../data-access/customerRepository');
const AuditService = require('../cross-cutting/auditService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

class CustomerService {
  static listCustomers({ search, status, currentUser, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const role = currentUser.role_name || currentUser.role;

    // Sales Executive only sees assigned customers
    const assignedUserId = role === 'Sales Executive' ? currentUser.id : null;

    const customers = CustomerRepository.findAll({
      search,
      status,
      assignedUserId,
      limit,
      offset
    });

    const total = CustomerRepository.countAll({
      search,
      status,
      assignedUserId
    });

    return {
      customers,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static getCustomerDetails(id, currentUser) {
    const customer = CustomerRepository.findById(id);
    if (!customer) {
      return null;
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && customer.assigned_user_id !== currentUser.id) {
      const err = new Error('Access denied to customer outside your assignment.');
      err.status = 403;
      throw err;
    }

    const activities = CustomerRepository.getCustomerActivities(id);
    return { customer, activities };
  }

  static validateCustomerData(data, excludeId = null) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Customer name is required.');
    }

    if (!data.email || !EMAIL_REGEX.test(data.email)) {
      errors.push('A valid email address is required.');
    } else {
      const existingEmail = CustomerRepository.findByEmail(data.email, excludeId);
      if (existingEmail) {
        errors.push(`A customer with email "${data.email}" already exists.`);
      }
    }

    if (!data.phone || !PHONE_REGEX.test(data.phone.replace(/[\s-]/g, ''))) {
      errors.push('A valid phone number is required (at least 10 digits).');
    }

    const validStatuses = ['Active', 'Inactive', 'Lead'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static createCustomer(data, currentUser, ipAddress = '127.0.0.1') {
    const validation = this.validateCustomerData(data);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const role = currentUser.role_name || currentUser.role;
    let assignedUserId = data.assignedUserId ? parseInt(data.assignedUserId, 10) : null;
    if (role === 'Sales Executive') {
      assignedUserId = currentUser.id;
    }

    const customer = CustomerRepository.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      company: data.company ? data.company.trim() : null,
      address: data.address ? data.address.trim() : null,
      status: data.status || 'Active',
      assignedUserId,
      notes: data.notes ? data.notes.trim() : null
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'CUSTOMER_CREATED',
      module: 'CUSTOMER',
      recordId: customer.id,
      details: `Created customer: ${customer.name} (${customer.email})`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, customer };
  }

  static updateCustomer(id, data, currentUser, ipAddress = '127.0.0.1') {
    const existing = CustomerRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Customer not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.assigned_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied to update customer outside your assignment.'] };
    }

    const validation = this.validateCustomerData(data, id);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    let assignedUserId = data.assignedUserId !== undefined 
      ? (data.assignedUserId ? parseInt(data.assignedUserId, 10) : null)
      : existing.assigned_user_id;

    if (role === 'Sales Executive') {
      assignedUserId = existing.assigned_user_id;
    }

    const updated = CustomerRepository.update(id, {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      company: data.company ? data.company.trim() : null,
      address: data.address ? data.address.trim() : null,
      status: data.status || existing.status,
      assignedUserId,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'CUSTOMER_UPDATED',
      module: 'CUSTOMER',
      recordId: updated.id,
      details: `Updated customer: ${updated.name}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, customer: updated };
  }

  static deleteCustomer(id, currentUser, ipAddress = '127.0.0.1') {
    const existing = CustomerRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Customer not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive') {
      return { success: false, errors: ['Only Managers and Admins are permitted to delete customer records.'] };
    }

    CustomerRepository.delete(id);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'CUSTOMER_DELETED',
      module: 'CUSTOMER',
      recordId: id,
      details: `Deleted customer: ${existing.name} (${existing.email})`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }
}

module.exports = CustomerService;
