const { getDatabase } = require('../database/db');

class OpportunityRepository {
  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT o.*, 
             c.name as customer_name, c.email as customer_email,
             u.full_name as owner_name, u.email as owner_email,
             ROUND((o.amount * o.probability / 100.0), 2) as weighted_amount
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.id
      JOIN users u ON o.owner_user_id = u.id
      WHERE o.id = ?
    `).get(id);
  }

  static findAll({ search = '', stage = '', ownerUserId = null, customerId = null, limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT o.*, 
             c.name as customer_name,
             u.full_name as owner_name,
             ROUND((o.amount * o.probability / 100.0), 2) as weighted_amount
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.id
      JOIN users u ON o.owner_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (o.name LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (stage) {
      query += ` AND o.stage = ?`;
      params.push(stage);
    }

    if (ownerUserId) {
      query += ` AND o.owner_user_id = ?`;
      params.push(ownerUserId);
    }

    if (customerId) {
      query += ` AND o.customer_id = ?`;
      params.push(customerId);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static countAll({ search = '', stage = '', ownerUserId = null, customerId = null } = {}) {
    const db = getDatabase();
    let query = `
      SELECT COUNT(*) as total 
      FROM opportunities o 
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (o.name LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (stage) {
      query += ` AND o.stage = ?`;
      params.push(stage);
    }

    if (ownerUserId) {
      query += ` AND o.owner_user_id = ?`;
      params.push(ownerUserId);
    }

    if (customerId) {
      query += ` AND o.customer_id = ?`;
      params.push(customerId);
    }

    const row = db.prepare(query).get(...params);
    return row ? row.total : 0;
  }

  static create({ name, customerId, ownerUserId, stage = 'Qualification', amount, probability, expectedCloseDate, source = 'Direct', notes = null }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO opportunities (name, customer_id, owner_user_id, stage, amount, probability, expected_close_date, source, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, customerId, ownerUserId, stage, amount, probability, expectedCloseDate, source, notes);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { name, customerId, ownerUserId, stage, amount, probability, expectedCloseDate, source, notes }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE opportunities
      SET name = ?, customer_id = ?, owner_user_id = ?, stage = ?, amount = ?, probability = ?, expected_close_date = ?, source = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(name, customerId, ownerUserId, stage, amount, probability, expectedCloseDate, source, notes, id);
    return this.findById(id);
  }

  static updateStage(id, stage) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE opportunities
      SET stage = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(stage, id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare(`DELETE FROM opportunities WHERE id = ?`).run(id);
  }

  static getPipelineSummary(ownerUserId = null) {
    const db = getDatabase();
    let query = `
      SELECT stage, 
             COUNT(*) as count, 
             COALESCE(SUM(amount), 0) as total_amount, 
             COALESCE(SUM(ROUND((amount * probability / 100.0), 2)), 0) as weighted_amount
      FROM opportunities
      WHERE 1=1
    `;
    const params = [];
    if (ownerUserId) {
      query += ` AND owner_user_id = ?`;
      params.push(ownerUserId);
    }
    query += ` GROUP BY stage`;
    return db.prepare(query).all(...params);
  }
}

module.exports = OpportunityRepository;
