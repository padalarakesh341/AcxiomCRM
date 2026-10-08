const { getDatabase } = require('../database/db');

class FollowUpRepository {
  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT f.*, u.full_name as assigned_name, u.email as assigned_email
      FROM follow_ups f
      JOIN users u ON f.assigned_user_id = u.id
      WHERE f.id = ?
    `).get(id);
  }

  static findAll({ search = '', status = '', type = '', entityType = '', assignedUserId = null, filterRange = '', limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT f.*, u.full_name as assigned_name
      FROM follow_ups f
      JOIN users u ON f.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND f.subject LIKE ?`;
      params.push(`%${search}%`);
    }

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    if (type) {
      query += ` AND f.type = ?`;
      params.push(type);
    }

    if (entityType) {
      query += ` AND f.entity_type = ?`;
      params.push(entityType);
    }

    if (assignedUserId) {
      query += ` AND f.assigned_user_id = ?`;
      params.push(assignedUserId);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (filterRange === 'overdue') {
      query += ` AND f.status = 'Planned' AND date(f.follow_up_date) < date(?)`;
      params.push(todayStr);
    } else if (filterRange === 'today') {
      query += ` AND date(f.follow_up_date) = date(?)`;
      params.push(todayStr);
    } else if (filterRange === 'upcoming') {
      query += ` AND f.status = 'Planned' AND date(f.follow_up_date) >= date(?)`;
      params.push(todayStr);
    }

    query += ` ORDER BY f.follow_up_date ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static countAll({ search = '', status = '', type = '', entityType = '', assignedUserId = null, filterRange = '' } = {}) {
    const db = getDatabase();
    let query = `SELECT COUNT(*) as total FROM follow_ups f WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND f.subject LIKE ?`;
      params.push(`%${search}%`);
    }

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    if (type) {
      query += ` AND f.type = ?`;
      params.push(type);
    }

    if (entityType) {
      query += ` AND f.entity_type = ?`;
      params.push(entityType);
    }

    if (assignedUserId) {
      query += ` AND f.assigned_user_id = ?`;
      params.push(assignedUserId);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (filterRange === 'overdue') {
      query += ` AND f.status = 'Planned' AND date(f.follow_up_date) < date(?)`;
      params.push(todayStr);
    } else if (filterRange === 'today') {
      query += ` AND date(f.follow_up_date) = date(?)`;
      params.push(todayStr);
    } else if (filterRange === 'upcoming') {
      query += ` AND f.status = 'Planned' AND date(f.follow_up_date) >= date(?)`;
      params.push(todayStr);
    }

    const row = db.prepare(query).get(...params);
    return row ? row.total : 0;
  }

  static create({ subject, entityType, entityId, followUpDate, type = 'Call', status = 'Planned', notes = null, assignedUserId }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO follow_ups (subject, entity_type, entity_id, follow_up_date, type, status, notes, assigned_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(subject, entityType, entityId, followUpDate, type, status, notes, assignedUserId);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { subject, entityType, entityId, followUpDate, type, status, notes, assignedUserId }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE follow_ups
      SET subject = ?, entity_type = ?, entity_id = ?, follow_up_date = ?, type = ?, status = ?, notes = ?, assigned_user_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(subject, entityType, entityId, followUpDate, type, status, notes, assignedUserId, id);
    return this.findById(id);
  }

  static markCompleted(id) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE follow_ups
      SET status = 'Completed', completed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  static reschedule(id, newDate, notes = null) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE follow_ups
      SET follow_up_date = ?, status = 'Planned', notes = COALESCE(?, notes), updated_at = datetime('now')
      WHERE id = ?
    `).run(newDate, notes, id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare(`DELETE FROM follow_ups WHERE id = ?`).run(id);
  }

  static getUpcomingAndOverdue(assignedUserId = null, limit = 5) {
    const db = getDatabase();
    const todayStr = new Date().toISOString().split('T')[0];

    let overdueQuery = `
      SELECT f.*, u.full_name as assigned_name
      FROM follow_ups f
      JOIN users u ON f.assigned_user_id = u.id
      WHERE f.status = 'Planned' AND date(f.follow_up_date) < date(?)
    `;
    const overdueParams = [todayStr];
    if (assignedUserId) {
      overdueQuery += ` AND f.assigned_user_id = ?`;
      overdueParams.push(assignedUserId);
    }
    overdueQuery += ` ORDER BY f.follow_up_date ASC LIMIT ?`;
    overdueParams.push(limit);

    let upcomingQuery = `
      SELECT f.*, u.full_name as assigned_name
      FROM follow_ups f
      JOIN users u ON f.assigned_user_id = u.id
      WHERE f.status = 'Planned' AND date(f.follow_up_date) >= date(?)
    `;
    const upcomingParams = [todayStr];
    if (assignedUserId) {
      upcomingQuery += ` AND f.assigned_user_id = ?`;
      upcomingParams.push(assignedUserId);
    }
    upcomingQuery += ` ORDER BY f.follow_up_date ASC LIMIT ?`;
    upcomingParams.push(limit);

    return {
      overdue: db.prepare(overdueQuery).all(...overdueParams),
      upcoming: db.prepare(upcomingQuery).all(...upcomingParams)
    };
  }
}

module.exports = FollowUpRepository;
