const OpportunityRepository = require('../data-access/opportunityRepository');
const AuditService = require('../cross-cutting/auditService');
const { validateOpportunity, OPPORTUNITY_STAGES } = require('../domain/opportunityRules');

class OpportunityService {
  static listOpportunities({ search, stage, currentUser, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const role = currentUser.role_name || currentUser.role;

    // Sales Executive only sees owned opportunities
    const ownerUserId = role === 'Sales Executive' ? currentUser.id : null;

    const opportunities = OpportunityRepository.findAll({
      search,
      stage,
      ownerUserId,
      limit,
      offset
    });

    const total = OpportunityRepository.countAll({
      search,
      stage,
      ownerUserId
    });

    return {
      opportunities,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static getOpportunityDetails(id, currentUser) {
    const opportunity = OpportunityRepository.findById(id);
    if (!opportunity) return null;

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && opportunity.owner_user_id !== currentUser.id) {
      const err = new Error('Access denied to opportunity outside your ownership.');
      err.status = 403;
      throw err;
    }

    return opportunity;
  }

  static getKanbanData(currentUser) {
    const role = currentUser.role_name || currentUser.role;
    const ownerUserId = role === 'Sales Executive' ? currentUser.id : null;

    const all = OpportunityRepository.findAll({
      ownerUserId,
      limit: 200,
      offset: 0
    });

    const columns = {
      Qualification: [],
      Proposal: [],
      Negotiation: [],
      Won: [],
      Lost: []
    };

    all.forEach(opp => {
      if (columns[opp.stage]) {
        columns[opp.stage].push(opp);
      }
    });

    return columns;
  }

  static createOpportunity(data, currentUser, ipAddress = '127.0.0.1') {
    const role = currentUser.role_name || currentUser.role;
    let ownerUserId = data.ownerUserId ? parseInt(data.ownerUserId, 10) : null;
    if (role === 'Sales Executive') {
      ownerUserId = currentUser.id;
    } else if (!ownerUserId) {
      ownerUserId = currentUser.id;
    }

    const payload = {
      name: data.name ? data.name.trim() : '',
      customerId: parseInt(data.customerId, 10),
      ownerUserId,
      stage: data.stage || 'Qualification',
      amount: parseFloat(data.amount),
      probability: parseInt(data.probability, 10),
      expectedCloseDate: data.expectedCloseDate,
      source: data.source || 'Direct',
      notes: data.notes ? data.notes.trim() : null
    };

    if (!payload.name) {
      return { success: false, errors: ['Opportunity name is required.'] };
    }
    if (!payload.customerId || isNaN(payload.customerId)) {
      return { success: false, errors: ['Valid Customer selection is required.'] };
    }

    const validation = validateOpportunity(payload);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const opportunity = OpportunityRepository.create(payload);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'OPPORTUNITY_CREATED',
      module: 'OPPORTUNITY',
      recordId: opportunity.id,
      details: `Created opportunity: ${opportunity.name} ($${opportunity.amount}, Stage: ${opportunity.stage})`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, opportunity };
  }

  static updateOpportunity(id, data, currentUser, ipAddress = '127.0.0.1') {
    const existing = OpportunityRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Opportunity not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.owner_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied to update opportunity outside your ownership.'] };
    }

    let ownerUserId = data.ownerUserId !== undefined 
      ? (data.ownerUserId ? parseInt(data.ownerUserId, 10) : null)
      : existing.owner_user_id;

    if (role === 'Sales Executive') {
      ownerUserId = existing.owner_user_id;
    }

    const payload = {
      name: data.name ? data.name.trim() : existing.name,
      customerId: data.customerId ? parseInt(data.customerId, 10) : existing.customer_id,
      ownerUserId,
      stage: data.stage || existing.stage,
      amount: data.amount !== undefined ? parseFloat(data.amount) : existing.amount,
      probability: data.probability !== undefined ? parseInt(data.probability, 10) : existing.probability,
      expectedCloseDate: data.expectedCloseDate || existing.expected_close_date,
      source: data.source || existing.source,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes
    };

    const validation = validateOpportunity(payload);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const updated = OpportunityRepository.update(id, payload);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'OPPORTUNITY_UPDATED',
      module: 'OPPORTUNITY',
      recordId: updated.id,
      details: `Updated opportunity: ${updated.name} (Stage: ${updated.stage}, Amount: $${updated.amount})`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, opportunity: updated };
  }

  static updateStage(id, stage, currentUser, ipAddress = '127.0.0.1') {
    const existing = OpportunityRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Opportunity not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.owner_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied.'] };
    }

    if (!Object.values(OPPORTUNITY_STAGES).includes(stage)) {
      return { success: false, errors: ['Invalid stage specified.'] };
    }

    OpportunityRepository.updateStage(id, stage);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'OPPORTUNITY_STAGE_CHANGED',
      module: 'OPPORTUNITY',
      recordId: id,
      details: `Opportunity #${id} stage updated from ${existing.stage} to ${stage}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }

  static deleteOpportunity(id, currentUser, ipAddress = '127.0.0.1') {
    const existing = OpportunityRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Opportunity not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive') {
      return { success: false, errors: ['Only Managers and Admins are permitted to delete opportunities.'] };
    }

    OpportunityRepository.delete(id);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'OPPORTUNITY_DELETED',
      module: 'OPPORTUNITY',
      recordId: id,
      details: `Deleted opportunity: ${existing.name}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }
}

module.exports = OpportunityService;
