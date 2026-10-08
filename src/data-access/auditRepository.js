const { getDatabase } = require('../database/db');

class AuditRepository {
  static findAll({ userId = null, module = '', action = '', result = '', startDate = '', endDate = '', limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT a.*
      FROM audit_logs a
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ` AND a.user_id = ?`;
      params.push(userId);
    }

    if (module) {
      query += ` AND a.module = ?`;
      params.push(module);
    }

    if (action) {
      query += ` AND a.action = ?`;
      params.push(action);
    }

    if (result) {
      query += ` AND a.result = ?`;
      params.push(result);
    }

    if (startDate) {
      query += ` AND date(a.created_at) >= date(?)`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date(a.created_at) <= date(?)`;
      params.push(endDate);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static countAll({ userId = null, module = '', action = '', result = '', startDate = '', endDate = '' } = {}) {
    const db = getDatabase();
    let query = `SELECT COUNT(*) as total FROM audit_logs a WHERE 1=1`;
    const params = [];

    if (userId) {
      query += ` AND a.user_id = ?`;
      params.push(userId);
    }

    if (module) {
      query += ` AND a.module = ?`;
      params.push(module);
    }

    if (action) {
      query += ` AND a.action = ?`;
      params.push(action);
    }

    if (result) {
      query += ` AND a.result = ?`;
      params.push(result);
    }

    if (startDate) {
      query += ` AND date(a.created_at) >= date(?)`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date(a.created_at) <= date(?)`;
      params.push(endDate);
    }

    const row = db.prepare(query).get(...params);
    return row ? row.total : 0;
  }

  static getSecurityStats() {
    const db = getDatabase();
    const loginSuccessCount = db.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN_SUCCESS'`).get().count;
    const loginFailedCount = db.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN_FAILED'`).get().count;
    const lockedCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE locked_until IS NOT NULL AND datetime(locked_until) > datetime('now')`).get().count;
    const activeUsersCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE is_active = 1`).get().count;

    return {
      loginSuccessCount,
      loginFailedCount,
      lockedCount,
      activeUsersCount
    };
  }
}

module.exports = AuditRepository;
