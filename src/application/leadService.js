const LeadRepository = require('../data-access/leadRepository');
const CustomerRepository = require('../data-access/customerRepository');
const OpportunityRepository = require('../data-access/opportunityRepository');
const AuditService = require('../cross-cutting/auditService');
const { canTransitionLead, canConvertLead, LEAD_STATUSES } = require('../domain/leadWorkflow');
const { validateOpportunity } = require('../domain/opportunityRules');
const { getDatabase } = require('../database/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class LeadService {
  static listLeads({ search, status, priority, source, currentUser, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const role = currentUser.role_name || currentUser.role;

    // Sales Executive only sees assigned leads
    const assignedUserId = role === 'Sales Executive' ? currentUser.id : null;

    const leads = LeadRepository.findAll({
      search,
      status,
      priority,
      source,
      assignedUserId,
      limit,
      offset
    });

    const total = LeadRepository.countAll({
      search,
      status,
      priority,
      source,
      assignedUserId
    });

    return {
      leads,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static getLeadDetails(id, currentUser) {
    const lead = LeadRepository.findById(id);
    if (!lead) return null;

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && lead.assigned_user_id !== currentUser.id) {
      const err = new Error('Access denied to lead outside your assignment.');
      err.status = 403;
      throw err;
    }

    const activities = LeadRepository.getLeadActivities(id);
    return { lead, activities };
  }

  static validateLeadData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Lead title/requirement is required.');
    }

    if (!data.contactPerson || data.contactPerson.trim().length === 0) {
      errors.push('Contact person name is required.');
    }

    if (!data.email || !EMAIL_REGEX.test(data.email)) {
      errors.push('A valid email address is required.');
    }

    if (!data.phone || data.phone.trim().length < 7) {
      errors.push('A valid phone number is required.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static createLead(data, currentUser, ipAddress = '127.0.0.1') {
    const validation = this.validateLeadData(data);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const role = currentUser.role_name || currentUser.role;
    let assignedUserId = data.assignedUserId ? parseInt(data.assignedUserId, 10) : null;
    if (role === 'Sales Executive') {
      assignedUserId = currentUser.id;
    }

    const lead = LeadRepository.create({
      title: data.title.trim(),
      contactPerson: data.contactPerson.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      company: data.company ? data.company.trim() : null,
      source: data.source || 'Website',
      status: data.status || 'New',
      priority: data.priority || 'Medium',
      assignedUserId,
      notes: data.notes ? data.notes.trim() : null
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'LEAD_CREATED',
      module: 'LEAD',
      recordId: lead.id,
      details: `Created lead: ${lead.title} (${lead.contact_person})`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, lead };
  }

  static updateLead(id, data, currentUser, ipAddress = '127.0.0.1') {
    const existing = LeadRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Lead not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.assigned_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied to update lead outside your assignment.'] };
    }

    const validation = this.validateLeadData(data);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Workflow validation on status change
    if (data.status && data.status !== existing.status) {
      const transitionCheck = canTransitionLead(existing.status, data.status);
      if (!transitionCheck.allowed) {
        return { success: false, errors: [transitionCheck.reason] };
      }
    }

    let assignedUserId = data.assignedUserId !== undefined 
      ? (data.assignedUserId ? parseInt(data.assignedUserId, 10) : null)
      : existing.assigned_user_id;

    if (role === 'Sales Executive') {
      assignedUserId = existing.assigned_user_id;
    }

    const updated = LeadRepository.update(id, {
      title: data.title.trim(),
      contactPerson: data.contactPerson.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      company: data.company ? data.company.trim() : null,
      source: data.source || existing.source,
      status: data.status || existing.status,
      priority: data.priority || existing.priority,
      assignedUserId,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes
    });

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'LEAD_UPDATED',
      module: 'LEAD',
      recordId: updated.id,
      details: `Updated lead: ${updated.title} (Status: ${updated.status})`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, lead: updated };
  }

  /**
   * Convert Qualified Lead to Customer & Opportunity
   */
  static convertLead(id, conversionData = {}, currentUser, ipAddress = '127.0.0.1') {
    const lead = LeadRepository.findById(id);
    if (!lead) {
      return { success: false, errors: ['Lead not found.'] };
    }

    const convertCheck = canConvertLead(lead);
    if (!convertCheck.allowed) {
      return { success: false, errors: [convertCheck.reason] };
    }

    const db = getDatabase();
    const role = currentUser.role_name || currentUser.role;

    // Use transaction for atomic lead conversion
    const transaction = db.transaction(() => {
      // 1. Create Customer or link existing if email matches
      let customer = CustomerRepository.findByEmail(lead.email);
      if (!customer) {
        customer = CustomerRepository.create({
          name: conversionData.customerName || lead.contact_person,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          address: conversionData.address || null,
          status: 'Active',
          assignedUserId: lead.assigned_user_id || currentUser.id,
          notes: `Converted from lead: ${lead.title}`
        });
      }

      // 2. Optional Opportunity Creation
      let opportunity = null;
      if (conversionData.createOpportunity !== false && conversionData.opportunityName) {
        const oppData = {
          name: conversionData.opportunityName,
          customerId: customer.id,
          ownerUserId: lead.assigned_user_id || currentUser.id,
          stage: conversionData.stage || 'Qualification',
          amount: parseFloat(conversionData.amount) || 1000,
          probability: parseInt(conversionData.probability, 10) || 50,
          expectedCloseDate: conversionData.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          source: lead.source,
          notes: `Generated from converted lead #${lead.id}`
        };

        const oppValidation = validateOpportunity(oppData);
        if (!oppValidation.valid) {
          throw new Error(oppValidation.errors.join(', '));
        }

        opportunity = OpportunityRepository.create(oppData);
      }

      // 3. Mark lead as Converted
      LeadRepository.markConverted(lead.id, customer.id, opportunity ? opportunity.id : null);

      return { customer, opportunity };
    });

    try {
      const result = transaction();

      AuditService.log({
        userId: currentUser.id,
        username: currentUser.username,
        role,
        action: 'LEAD_CONVERTED',
        module: 'LEAD',
        recordId: lead.id,
        details: `Converted lead to Customer #${result.customer.id}` + (result.opportunity ? ` and Opportunity #${result.opportunity.id}` : ''),
        ipAddress,
        result: 'SUCCESS'
      });

      return { success: true, ...result };
    } catch (err) {
      return { success: false, errors: [err.message] };
    }
  }

  static deleteLead(id, currentUser, ipAddress = '127.0.0.1') {
    const existing = LeadRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Lead not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive') {
      return { success: false, errors: ['Only Managers and Admins are permitted to delete leads.'] };
    }

    LeadRepository.delete(id);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'LEAD_DELETED',
      module: 'LEAD',
      recordId: id,
      details: `Deleted lead: ${existing.title}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }
}

module.exports = LeadService;
