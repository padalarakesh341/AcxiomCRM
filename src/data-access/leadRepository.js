const { getDatabase } = require('../database/db');

class LeadRepository {
  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT l.*, u.full_name as assigned_to_name, u.email as assigned_to_email,
             c.name as converted_customer_name,
             o.name as converted_opportunity_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_user_id = u.id
      LEFT JOIN customers c ON l.converted_customer_id = c.id
      LEFT JOIN opportunities o ON l.converted_opportunity_id = o.id
      WHERE l.id = ?
    `).get(id);
  }

  static findAll({ search = '', status = '', priority = '', source = '', assignedUserId = null, limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT l.*, u.full_name as assigned_to_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (l.title LIKE ? OR l.contact_person LIKE ? OR l.email LIKE ? OR l.company LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND l.priority = ?`;
      params.push(priority);
    }

    if (source) {
      query += ` AND l.source = ?`;
      params.push(source);
    }

    if (assignedUserId) {
      query += ` AND l.assigned_user_id = ?`;
      params.push(assignedUserId);
    }

    query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static countAll({ search = '', status = '', priority = '', source = '', assignedUserId = null } = {}) {
    const db = getDatabase();
    let query = `SELECT COUNT(*) as total FROM leads l WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (l.title LIKE ? OR l.contact_person LIKE ? OR l.email LIKE ? OR l.company LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND l.priority = ?`;
      params.push(priority);
    }

    if (source) {
      query += ` AND l.source = ?`;
      params.push(source);
    }

    if (assignedUserId) {
      query += ` AND l.assigned_user_id = ?`;
      params.push(assignedUserId);
    }

    const row = db.prepare(query).get(...params);
    return row ? row.total : 0;
  }

  static create({ title, contactPerson, email, phone, company = null, source = 'Website', status = 'New', priority = 'Medium', assignedUserId = null, notes = null }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO leads (title, contact_person, email, phone, company, source, status, priority, assigned_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(title, contactPerson, email, phone, company, source, status, priority, assignedUserId, notes);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { title, contactPerson, email, phone, company, source, status, priority, assignedUserId, notes }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE leads
      SET title = ?, contact_person = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, priority = ?, assigned_user_id = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(title, contactPerson, email, phone, company, source, status, priority, assignedUserId, notes, id);
    return this.findById(id);
  }

  static updateStatus(id, newStatus) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE leads 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, id);
  }

  static markConverted(id, customerId, opportunityId = null) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE leads
      SET status = 'Converted',
          converted_customer_id = ?,
          converted_opportunity_id = ?,
          converted_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(customerId, opportunityId, id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare(`DELETE FROM leads WHERE id = ?`).run(id);
  }

  static getLeadActivities(leadId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT f.*, u.full_name as assigned_name
      FROM follow_ups f
      LEFT JOIN users u ON f.assigned_user_id = u.id
      WHERE f.entity_type = 'Lead' AND f.entity_id = ?
      ORDER BY f.follow_up_date DESC
    `).all(leadId);
  }
}

module.exports = LeadRepository;
