const FollowUpRepository = require('../data-access/followUpRepository');
const AuditService = require('../cross-cutting/auditService');
const { validateNewFollowUp } = require('../domain/followUpRules');

class FollowUpService {
  static listFollowUps({ search, status, type, entityType, filterRange, currentUser, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const role = currentUser.role_name || currentUser.role;

    // Sales Executive only sees assigned follow-ups
    const assignedUserId = role === 'Sales Executive' ? currentUser.id : null;

    const followUps = FollowUpRepository.findAll({
      search,
      status,
      type,
      entityType,
      filterRange,
      assignedUserId,
      limit,
      offset
    });

    const total = FollowUpRepository.countAll({
      search,
      status,
      type,
      entityType,
      filterRange,
      assignedUserId
    });

    return {
      followUps,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static getFollowUpDetails(id, currentUser) {
    const followUp = FollowUpRepository.findById(id);
    if (!followUp) return null;

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && followUp.assigned_user_id !== currentUser.id) {
      const err = new Error('Access denied to follow-up outside your assignment.');
      err.status = 403;
      throw err;
    }

    return followUp;
  }

  static getUpcomingAndOverdue(currentUser) {
    const role = currentUser.role_name || currentUser.role;
    const assignedUserId = role === 'Sales Executive' ? currentUser.id : null;
    return FollowUpRepository.getUpcomingAndOverdue(assignedUserId, 10);
  }

  static createFollowUp(data, currentUser, ipAddress = '127.0.0.1') {
    const role = currentUser.role_name || currentUser.role;
    let assignedUserId = data.assignedUserId ? parseInt(data.assignedUserId, 10) : null;
    if (role === 'Sales Executive') {
      assignedUserId = currentUser.id;
    } else if (!assignedUserId) {
      assignedUserId = currentUser.id;
    }

    const payload = {
      subject: data.subject ? data.subject.trim() : '',
      entityType: data.entityType || 'Customer',
      entityId: parseInt(data.entityId, 10) || 0,
      followUpDate: data.followUpDate,
      type: data.type || 'Call',
      status: data.status || 'Planned',
      notes: data.notes ? data.notes.trim() : null,
      assignedUserId
    };

    const validation = validateNewFollowUp(payload);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const followUp = FollowUpRepository.create(payload);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'FOLLOW_UP_SCHEDULED',
      module: 'FOLLOW_UP',
      recordId: followUp.id,
      details: `Scheduled follow-up: "${followUp.subject}" for ${followUp.follow_up_date}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, followUp };
  }

  static updateFollowUp(id, data, currentUser, ipAddress = '127.0.0.1') {
    const existing = FollowUpRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Follow-up not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.assigned_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied.'] };
    }

    let assignedUserId = data.assignedUserId !== undefined 
      ? (data.assignedUserId ? parseInt(data.assignedUserId, 10) : null)
      : existing.assigned_user_id;

    if (role === 'Sales Executive') {
      assignedUserId = existing.assigned_user_id;
    }

    const payload = {
      subject: data.subject ? data.subject.trim() : existing.subject,
      entityType: data.entityType || existing.entity_type,
      entityId: data.entityId ? parseInt(data.entityId, 10) : existing.entity_id,
      followUpDate: data.followUpDate || existing.follow_up_date,
      type: data.type || existing.type,
      status: data.status || existing.status,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes,
      assignedUserId
    };

    const updated = FollowUpRepository.update(id, payload);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'FOLLOW_UP_UPDATED',
      module: 'FOLLOW_UP',
      recordId: updated.id,
      details: `Updated follow-up: "${updated.subject}"`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true, followUp: updated };
  }

  static markCompleted(id, currentUser, ipAddress = '127.0.0.1') {
    const existing = FollowUpRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Follow-up not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.assigned_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied.'] };
    }

    FollowUpRepository.markCompleted(id);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'FOLLOW_UP_COMPLETED',
      module: 'FOLLOW_UP',
      recordId: id,
      details: `Marked follow-up #${id} as completed`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }

  static reschedule(id, newDate, notes = null, currentUser, ipAddress = '127.0.0.1') {
    const existing = FollowUpRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Follow-up not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive' && existing.assigned_user_id !== currentUser.id) {
      return { success: false, errors: ['Access denied.'] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(newDate);
    dateObj.setHours(0, 0, 0, 0);

    if (dateObj < today) {
      return { success: false, errors: ['Rescheduled date cannot be in the past.'] };
    }

    FollowUpRepository.reschedule(id, newDate, notes);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'FOLLOW_UP_RESCHEDULED',
      module: 'FOLLOW_UP',
      recordId: id,
      details: `Rescheduled follow-up #${id} from ${existing.follow_up_date} to ${newDate}`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }

  static deleteFollowUp(id, currentUser, ipAddress = '127.0.0.1') {
    const existing = FollowUpRepository.findById(id);
    if (!existing) {
      return { success: false, errors: ['Follow-up not found.'] };
    }

    const role = currentUser.role_name || currentUser.role;
    if (role === 'Sales Executive') {
      return { success: false, errors: ['Only Managers and Admins can delete follow-up records.'] };
    }

    FollowUpRepository.delete(id);

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role,
      action: 'FOLLOW_UP_DELETED',
      module: 'FOLLOW_UP',
      recordId: id,
      details: `Deleted follow-up: "${existing.subject}"`,
      ipAddress,
      result: 'SUCCESS'
    });

    return { success: true };
  }
}

module.exports = FollowUpService;
