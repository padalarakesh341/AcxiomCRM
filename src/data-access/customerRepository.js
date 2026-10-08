const { getDatabase } = require('../database/db');

class CustomerRepository {
  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT c.*, u.full_name as assigned_to_name, u.email as assigned_to_email
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE c.id = ?
    `).get(id);
  }

  static findByEmail(email, excludeId = null) {
    const db = getDatabase();
    let query = `SELECT * FROM customers WHERE LOWER(email) = LOWER(?)`;
    const params = [email];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    return db.prepare(query).get(...params);
  }

  static findByPhone(phone, excludeId = null) {
    const db = getDatabase();
    let query = `SELECT * FROM customers WHERE phone = ?`;
    const params = [phone];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    return db.prepare(query).get(...params);
  }

  static findAll({ search = '', status = '', assignedUserId = null, limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT c.*, u.full_name as assigned_to_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (assignedUserId) {
      query += ` AND c.assigned_user_id = ?`;
      params.push(assignedUserId);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static countAll({ search = '', status = '', assignedUserId = null } = {}) {
    const db = getDatabase();
    let query = `SELECT COUNT(*) as total FROM customers c WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (assignedUserId) {
      query += ` AND c.assigned_user_id = ?`;
      params.push(assignedUserId);
    }

    const row = db.prepare(query).get(...params);
    return row ? row.total : 0;
  }

  static create({ name, email, phone, company = null, address = null, status = 'Active', assignedUserId = null, notes = null }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO customers (name, email, phone, company, address, status, assigned_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, email, phone, company, address, status, assignedUserId, notes);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { name, email, phone, company, address, status, assignedUserId, notes }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE customers
      SET name = ?, email = ?, phone = ?, company = ?, address = ?, status = ?, assigned_user_id = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(name, email, phone, company, address, status, assignedUserId, notes, id);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare(`DELETE FROM customers WHERE id = ?`).run(id);
  }

  static getCustomerActivities(customerId) {
    const db = getDatabase();
    const opportunities = db.prepare(`
      SELECT o.*, u.full_name as owner_name 
      FROM opportunities o
      LEFT JOIN users u ON o.owner_user_id = u.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `).all(customerId);

    const followUps = db.prepare(`
      SELECT f.*, u.full_name as assigned_name
      FROM follow_ups f
      LEFT JOIN users u ON f.assigned_user_id = u.id
      WHERE f.entity_type = 'Customer' AND f.entity_id = ?
      ORDER BY f.follow_up_date DESC
    `).all(customerId);

    return { opportunities, followUps };
  }
}

module.exports = CustomerRepository;
