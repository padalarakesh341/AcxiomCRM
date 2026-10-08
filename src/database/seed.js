const bcrypt = require('bcryptjs');
const { getDatabase, closeDatabase } = require('./db');

async function seed() {
  console.log('--- Starting AcxiomCRM Database Seed ---');
  const db = getDatabase();

  // 1. Seed Roles
  const roles = [
    { id: 1, name: 'Admin', description: 'System Administrator with full access and audit control' },
    { id: 2, name: 'Manager', description: 'Sales Manager overseeing team pipelines, leads and reports' },
    { id: 3, name: 'Sales Executive', description: 'Frontline sales representative handling assigned records' }
  ];

  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)
  `);
  roles.forEach(r => insertRole.run(r.id, r.name, r.description));
  console.log('Roles seeded.');

  // 2. Seed Users
  const salt = await bcrypt.genSalt(12);
  const adminHash = await bcrypt.hash('Admin@12345', salt);
  const managerHash = await bcrypt.hash('Manager@12345', salt);
  const salesHash = await bcrypt.hash('Sales@12345', salt);

  const users = [
    {
      username: 'admin',
      email: 'admin@acxiom.com',
      password_hash: adminHash,
      role_id: 1,
      full_name: 'System Administrator',
      phone: '+1-800-555-0100'
    },
    {
      username: 'manager',
      email: 'manager@acxiom.com',
      password_hash: managerHash,
      role_id: 2,
      full_name: 'Marcus Vance',
      phone: '+1-800-555-0101'
    },
    {
      username: 'sales_rakesh',
      email: 'sales@acxiom.com',
      password_hash: salesHash,
      role_id: 3,
      full_name: 'Rakesh Padala',
      phone: '+1-800-555-0102'
    },
    {
      username: 'sales_elena',
      email: 'sales2@acxiom.com',
      password_hash: salesHash,
      role_id: 3,
      full_name: 'Elena Rostova',
      phone: '+1-800-555-0103'
    }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, role_id, full_name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  users.forEach(u => insertUser.run(u.username, u.email, u.password_hash, u.role_id, u.full_name, u.phone));
  console.log('Users seeded.');

  // Fetch created user IDs
  const adminUser = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get();
  const sales1 = db.prepare(`SELECT id FROM users WHERE username = 'sales_rakesh'`).get();
  const sales2 = db.prepare(`SELECT id FROM users WHERE username = 'sales_elena'`).get();

  // 3. Seed Customers
  const customers = [
    {
      name: 'Apex Global Logistics',
      email: 'contact@apexlogistics.com',
      phone: '+1-415-555-2671',
      company: 'Apex Logistics Inc.',
      address: '742 Evergreen Terrace, Springfield, OR',
      status: 'Active',
      assigned_user_id: sales1.id,
      notes: 'Key logistics partner with national fleet operations.'
    },
    {
      name: 'BlueWave Financial Technologies',
      email: 'procurement@bluewavefin.com',
      phone: '+1-212-555-9832',
      company: 'BlueWave FinTech',
      address: '100 Wall Street, 24th Floor, New York, NY',
      status: 'Active',
      assigned_user_id: sales1.id,
      notes: 'Tier-1 investment firm adopting CRM solutions.'
    },
    {
      name: 'Crestline Healthcare Solutions',
      email: 'info@crestlinehealth.org',
      phone: '+1-312-555-4411',
      company: 'Crestline Health',
      address: '500 Michigan Ave, Chicago, IL',
      status: 'Active',
      assigned_user_id: sales2.id,
      notes: 'Hospital network requiring HIPAA-compliant integrations.'
    },
    {
      name: 'Dynamic Robotics Corp',
      email: 'engineering@dynamicrobotics.io',
      phone: '+1-650-555-7799',
      company: 'Dynamic Robotics',
      address: '3000 Sand Hill Rd, Menlo Park, CA',
      status: 'Inactive',
      assigned_user_id: sales2.id,
      notes: 'Project paused pending Q1 capital raise.'
    }
  ];

  const insertCustomer = db.prepare(`
    INSERT OR IGNORE INTO customers (name, email, phone, company, address, status, assigned_user_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  customers.forEach(c => insertCustomer.run(c.name, c.email, c.phone, c.company, c.address, c.status, c.assigned_user_id, c.notes));
  console.log('Customers seeded.');

  const cust1 = db.prepare(`SELECT id FROM customers WHERE email = 'contact@apexlogistics.com'`).get();
  const cust2 = db.prepare(`SELECT id FROM customers WHERE email = 'procurement@bluewavefin.com'`).get();
  const cust3 = db.prepare(`SELECT id FROM customers WHERE email = 'info@crestlinehealth.org'`).get();

  // 4. Seed Leads
  const leads = [
    {
      title: 'Enterprise ERP Integration Lead',
      contact_person: 'David Kim',
      email: 'david.kim@summitretail.com',
      phone: '+1-206-555-1122',
      company: 'Summit Retail Group',
      source: 'Website',
      status: 'New',
      priority: 'High',
      assigned_user_id: sales1.id,
      notes: 'Interested in automating omnichannel workflows.'
    },
    {
      title: 'AI Analytics Platform Expansion',
      contact_person: 'Rachel Adams',
      email: 'rachel@quantummedia.co',
      phone: '+1-303-555-8833',
      company: 'Quantum Media Labs',
      source: 'Referral',
      status: 'Contacted',
      priority: 'Medium',
      assigned_user_id: sales1.id,
      notes: 'Discovery call held on Tuesday; shared technical whitepaper.'
    },
    {
      title: 'Cloud Security Audit Contract',
      contact_person: 'Carlos Mendez',
      email: 'carlos@vanguardcyber.net',
      phone: '+1-512-555-3490',
      company: 'Vanguard Cyber Systems',
      source: 'Campaign',
      status: 'Qualified',
      priority: 'High',
      assigned_user_id: sales2.id,
      notes: 'Budget approved ($75k); ready for proposal submission.'
    },
    {
      title: 'Legacy Database Migration',
      contact_person: 'Amanda Foster',
      email: 'afoster@heritagebank.com',
      phone: '+1-617-555-6677',
      company: 'Heritage National Bank',
      source: 'Cold Call',
      status: 'Unqualified',
      priority: 'Low',
      assigned_user_id: sales2.id,
      notes: 'Company is locked in a multi-year contract until 2028.'
    }
  ];

  const insertLead = db.prepare(`
    INSERT OR IGNORE INTO leads (title, contact_person, email, phone, company, source, status, priority, assigned_user_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  leads.forEach(l => insertLead.run(l.title, l.contact_person, l.email, l.phone, l.company, l.source, l.status, l.priority, l.assigned_user_id, l.notes));
  console.log('Leads seeded.');

  // 5. Seed Opportunities
  const futureDate1 = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const futureDate2 = new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0];
  const futureDate3 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  const pastDate = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];

  const opportunities = [
    {
      name: 'Apex Fleet Telematics Contract',
      customer_id: cust1.id,
      owner_user_id: sales1.id,
      stage: 'Proposal',
      amount: 45000.00,
      probability: 60,
      expected_close_date: futureDate1,
      source: 'Direct',
      notes: 'Proposal delivered; waiting for board sign-off.'
    },
    {
      name: 'BlueWave FinTech Risk Engine Upgrade',
      customer_id: cust2.id,
      owner_user_id: sales1.id,
      stage: 'Negotiation',
      amount: 85000.00,
      probability: 80,
      expected_close_date: futureDate2,
      source: 'Referral',
      notes: 'Final contract terms under legal review.'
    },
    {
      name: 'Crestline Hospital Telehealth Module',
      customer_id: cust3.id,
      owner_user_id: sales2.id,
      stage: 'Qualification',
      amount: 32000.00,
      probability: 40,
      expected_close_date: futureDate3,
      source: 'Website',
      notes: 'Technical requirements gathering in progress.'
    },
    {
      name: 'Apex Mobile Dispatch Extension',
      customer_id: cust1.id,
      owner_user_id: sales1.id,
      stage: 'Won',
      amount: 28000.00,
      probability: 100,
      expected_close_date: pastDate,
      source: 'Direct',
      notes: 'Deal closed and invoiced.'
    }
  ];

  const insertOpp = db.prepare(`
    INSERT INTO opportunities (name, customer_id, owner_user_id, stage, amount, probability, expected_close_date, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  opportunities.forEach(o => insertOpp.run(o.name, o.customer_id, o.owner_user_id, o.stage, o.amount, o.probability, o.expected_close_date, o.source, o.notes));
  console.log('Opportunities seeded.');

  // 6. Seed Follow-Ups
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const overdueStr = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

  const followUps = [
    {
      subject: 'Review revised legal terms with General Counsel',
      entity_type: 'Customer',
      entity_id: cust2.id,
      follow_up_date: todayStr,
      type: 'Meeting',
      status: 'Planned',
      notes: 'Confirm indemnification clause.',
      assigned_user_id: sales1.id
    },
    {
      subject: 'Send technical demo recording to engineering head',
      entity_type: 'Lead',
      entity_id: 1,
      follow_up_date: tomorrowStr,
      type: 'Email',
      status: 'Planned',
      notes: 'Include security architecture attachment.',
      assigned_user_id: sales1.id
    },
    {
      subject: 'Quarterly check-in on telematics rollout',
      entity_type: 'Customer',
      entity_id: cust1.id,
      follow_up_date: overdueStr,
      type: 'Call',
      status: 'Planned',
      notes: 'Follow up after fleet test phase 1.',
      assigned_user_id: sales1.id
    },
    {
      subject: 'Initial discovery call with Crestline team',
      entity_type: 'Customer',
      entity_id: cust3.id,
      follow_up_date: overdueStr,
      type: 'Call',
      status: 'Completed',
      notes: 'Call completed. Shared onboarding checklist.',
      assigned_user_id: sales2.id
    }
  ];

  const insertFollowUp = db.prepare(`
    INSERT INTO follow_ups (subject, entity_type, entity_id, follow_up_date, type, status, notes, assigned_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  followUps.forEach(f => insertFollowUp.run(f.subject, f.entity_type, f.entity_id, f.follow_up_date, f.type, f.status, f.notes, f.assigned_user_id));
  console.log('Follow-ups seeded.');

  // 7. Seed Initial Audit Logs
  const auditLogs = [
    {
      user_id: adminUser.id,
      username: 'admin',
      role: 'Admin',
      action: 'SYSTEM_INITIALIZATION',
      module: 'SYSTEM',
      record_id: '1',
      details: 'AcxiomCRM initialized with baseline seed data.',
      ip_address: '127.0.0.1',
      result: 'SUCCESS'
    },
    {
      user_id: adminUser.id,
      username: 'admin',
      role: 'Admin',
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      record_id: null,
      details: 'Admin logged into system.',
      ip_address: '127.0.0.1',
      result: 'SUCCESS'
    }
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, username, role, action, module, record_id, details, ip_address, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  auditLogs.forEach(a => insertAudit.run(a.user_id, a.username, a.role, a.action, a.module, a.record_id, a.details, a.ip_address, a.result));
  console.log('Audit logs seeded.');

  console.log('--- Seed Finished Successfully! ---');
}

if (require.main === module) {
  seed()
    .then(() => {
      closeDatabase();
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seed;
