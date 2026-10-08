const { getDatabase } = require('../database/db');
const logger = require('./logger');

/**
 * Append-Only Centralized Audit Logging Service
 */
class AuditService {
  /**
   * Log an event into the audit_logs table
   */
  static log({
    userId = null,
    username = 'Anonymous',
    role = 'Guest',
    action,
    module,
    recordId = null,
    details = null,
    ipAddress = '127.0.0.1',
    result = 'SUCCESS'
  }) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO audit_logs (user_id, username, role, action, module, record_id, details, ip_address, result)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const serializedDetails = typeof details === 'object' && details !== null 
        ? JSON.stringify(details) 
        : (details ? String(details) : null);

      stmt.run(
        userId,
        username,
        role,
        action,
        module,
        recordId ? String(recordId) : null,
        serializedDetails,
        ipAddress,
        result
      );

      logger.info(`AUDIT: [${module}] [${action}] by ${username} (${role}) - ${result}`);
    } catch (err) {
      logger.error('Failed to write audit log entry', err);
    }
  }

  /**
   * Helper to extract client IP from express req
   */
  static getClientIp(req) {
    if (!req) return '127.0.0.1';
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
  }
}

module.exports = AuditService;
