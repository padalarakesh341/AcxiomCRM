const { getDatabase } = require('../database/db');

class UserRepository {
  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `).get(id);
  }

  static findByEmail(email) {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email);
  }

  static findByUsername(username) {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE LOWER(u.username) = LOWER(?)
    `).get(username);
  }

  static findAll({ search = '', roleId = null, isActive = null } = {}) {
    const db = getDatabase();
    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, 
             u.failed_login_attempts, u.locked_until, u.last_login_at, u.created_at,
             r.id as role_id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (roleId) {
      query += ` AND u.role_id = ?`;
      params.push(roleId);
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query += ` AND u.is_active = ?`;
      params.push(parseInt(isActive, 10));
    }

    query += ` ORDER BY u.created_at DESC`;
    return db.prepare(query).all(...params);
  }

  static create({ username, email, passwordHash, roleId, fullName, phone = null }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role_id, full_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(username, email, passwordHash, roleId, fullName, phone);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { fullName, phone, roleId, isActive }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE users 
      SET full_name = ?, phone = ?, role_id = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(fullName, phone, roleId, isActive ? 1 : 0, id);
    return this.findById(id);
  }

  static updatePassword(id, passwordHash) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE users 
      SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(passwordHash, id);
  }

  static updateLockout(id, { failedAttempts, lockedUntil }) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE users 
      SET failed_login_attempts = ?, locked_until = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(failedAttempts, lockedUntil, id);
  }

  static resetLockout(id) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  static recordSuccessfulLogin(id) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  static getAllRoles() {
    const db = getDatabase();
    return db.prepare(`SELECT * FROM roles ORDER BY id ASC`).all();
  }

  static getSalesExecutives() {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.id, u.full_name, u.email, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1 AND r.name IN ('Sales Executive', 'Manager')
      ORDER BY u.full_name ASC
    `).all();
  }
}

module.exports = UserRepository;
