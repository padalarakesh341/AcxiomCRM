const { getDatabase } = require('../database/db');

class ReportRepository {
  /**
   * 1. Customer Report
   */
  static getCustomerReport({ status = '', assignedUserId = null, startDate = '', endDate = '' } = {}) {
    const db = getDatabase();
    let query = `
      SELECT c.id, c.name, c.email, c.phone, c.company, c.status, 
             u.full_name as owner_name, c.created_at
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (assignedUserId) {
      query += ` AND c.assigned_user_id = ?`;
      params.push(assignedUserId);
    }
    if (startDate) {
      query += ` AND date(c.created_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(c.created_at) <= date(?)`;
      params.push(endDate);
    }
    query += ` ORDER BY c.created_at DESC`;
    return db.prepare(query).all(...params);
  }

  /**
   * 2. Lead Report
   */
  static getLeadReport({ source = '', status = '', assignedUserId = null, startDate = '', endDate = '' } = {}) {
    const db = getDatabase();
    let query = `
      SELECT l.id, l.title, l.contact_person, l.email, l.phone, l.company, 
             l.source, l.status, l.priority, u.full_name as assigned_to_name,
             c.name as converted_customer_name, l.converted_at, l.created_at
      FROM leads l
      LEFT JOIN users u ON l.assigned_user_id = u.id
      LEFT JOIN customers c ON l.converted_customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (source) {
      query += ` AND l.source = ?`;
      params.push(source);
    }
    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }
    if (assignedUserId) {
      query += ` AND l.assigned_user_id = ?`;
      params.push(assignedUserId);
    }
    if (startDate) {
      query += ` AND date(l.created_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(l.created_at) <= date(?)`;
      params.push(endDate);
    }
    query += ` ORDER BY l.created_at DESC`;
    return db.prepare(query).all(...params);
  }

  /**
   * 3. Follow-Up Report
   */
  static getFollowUpReport({ status = '', type = '', assignedUserId = null, startDate = '', endDate = '' } = {}) {
    const db = getDatabase();
    let query = `
      SELECT f.id, f.subject, f.entity_type, f.entity_id, f.type, f.status,
             f.follow_up_date, u.full_name as assigned_to_name, f.completed_at
      FROM follow_ups f
      JOIN users u ON f.assigned_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }
    if (type) {
      query += ` AND f.type = ?`;
      params.push(type);
    }
    if (assignedUserId) {
      query += ` AND f.assigned_user_id = ?`;
      params.push(assignedUserId);
    }
    if (startDate) {
      query += ` AND date(f.follow_up_date) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(f.follow_up_date) <= date(?)`;
      params.push(endDate);
    }
    query += ` ORDER BY f.follow_up_date ASC`;
    return db.prepare(query).all(...params);
  }

  /**
   * 4. Opportunity Report
   */
  static getOpportunityReport({ stage = '', ownerUserId = null, startDate = '', endDate = '' } = {}) {
    const db = getDatabase();
    let query = `
      SELECT o.id, o.name, c.name as customer_name, u.full_name as owner_name,
             o.stage, o.amount, o.probability, 
             ROUND((o.amount * o.probability / 100.0), 2) as weighted_amount,
             o.expected_close_date, o.created_at
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.id
      JOIN users u ON o.owner_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (stage) {
      query += ` AND o.stage = ?`;
      params.push(stage);
    }
    if (ownerUserId) {
      query += ` AND o.owner_user_id = ?`;
      params.push(ownerUserId);
    }
    if (startDate) {
      query += ` AND date(o.expected_close_date) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(o.expected_close_date) <= date(?)`;
      params.push(endDate);
    }
    query += ` ORDER BY o.expected_close_date ASC`;
    return db.prepare(query).all(...params);
  }

  /**
   * 5. Pipeline Report (Aggregated Stage-wise and Owner-wise)
   */
  static getPipelineReport() {
    const db = getDatabase();
    const stageSummary = db.prepare(`
      SELECT stage, 
             COUNT(*) as count, 
             COALESCE(SUM(amount), 0) as total_amount,
             COALESCE(SUM(ROUND((amount * probability / 100.0), 2)), 0) as total_weighted_amount
      FROM opportunities
      GROUP BY stage
      ORDER BY 
        CASE stage
          WHEN 'Qualification' THEN 1
          WHEN 'Proposal' THEN 2
          WHEN 'Negotiation' THEN 3
          WHEN 'Won' THEN 4
          WHEN 'Lost' THEN 5
          ELSE 6
        END
    `).all();

    const ownerSummary = db.prepare(`
      SELECT u.id as user_id, u.full_name as owner_name,
             COUNT(*) as count,
             COALESCE(SUM(amount), 0) as total_amount,
             COALESCE(SUM(ROUND((amount * probability / 100.0), 2)), 0) as total_weighted_amount
      FROM opportunities o
      JOIN users u ON o.owner_user_id = u.id
      GROUP BY u.id, u.full_name
      ORDER BY total_amount DESC
    `).all();

    return { stageSummary, ownerSummary };
  }

  /**
   * 6. Sales / Conversion Report
   */
  static getConversionReport() {
    const db = getDatabase();
    const totalLeads = db.prepare(`SELECT COUNT(*) as count FROM leads`).get().count;
    const convertedLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status = 'Converted'`).get().count;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 10000) / 100 : 0;

    const leadSourceBreakdown = db.prepare(`
      SELECT source, 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as converted,
             ROUND(CAST(SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) AS REAL) * 100 / COUNT(*), 2) as conversion_rate
      FROM leads
      GROUP BY source
      ORDER BY total DESC
    `).all();

    const totalOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities`).get().count;
    const wonOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE stage = 'Won'`).get().count;
    const lostOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE stage = 'Lost'`).get().count;
    const winRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 10000) / 100 : 0;

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      leadSourceBreakdown,
      totalOpportunities,
      wonOpportunities,
      lostOpportunities,
      winRate
    };
  }

  /**
   * 7. User Activity Report
   */
  static getUserActivityReport() {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.id, u.full_name, u.email, r.name as role_name, u.is_active,
             u.last_login_at,
             (SELECT COUNT(*) FROM audit_logs a WHERE a.user_id = u.id) as total_actions,
             (SELECT COUNT(*) FROM leads l WHERE l.assigned_user_id = u.id) as assigned_leads,
             (SELECT COUNT(*) FROM opportunities o WHERE o.owner_user_id = u.id) as assigned_opportunities,
             (SELECT COUNT(*) FROM follow_ups f WHERE f.assigned_user_id = u.id AND f.status = 'Completed') as completed_follow_ups
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY total_actions DESC
    `).all();
  }

  /**
   * 8. Audit Report
   */
  static getAuditReport({ userId = null, module = '', action = '', startDate = '', endDate = '' } = {}) {
    const db = getDatabase();
    let query = `
      SELECT a.id, a.user_id, a.username, a.role, a.action, a.module, 
             a.record_id, a.details, a.ip_address, a.result, a.created_at
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
    if (startDate) {
      query += ` AND date(a.created_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(a.created_at) <= date(?)`;
      params.push(endDate);
    }
    query += ` ORDER BY a.created_at DESC`;
    return db.prepare(query).all(...params);
  }
}

module.exports = ReportRepository;
