const request = require('supertest');
const app = require('../src/app');
const { getDatabase } = require('../src/database/db');

describe('REST API Endpoints & Authorization', () => {
  let authToken = '';
  let salesToken = '';

  beforeAll(async () => {
    getDatabase();

    // Authenticate as Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@acxiom.com', password: 'Admin@12345' });
    
    expect(adminRes.statusCode).toBe(200);
    authToken = adminRes.body.data.token;

    // Authenticate as Sales Executive
    const salesRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sales@acxiom.com', password: 'Sales@12345' });

    expect(salesRes.statusCode).toBe(200);
    salesToken = salesRes.body.data.token;
  });

  describe('Authentication API', () => {
    test('GET /api/v1/auth/me should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/v1/auth/me should return 200 OK with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@acxiom.com');
      expect(res.body.data.user.password_hash).toBeUndefined(); // DTO protection
    });
  });

  describe('Customer API', () => {
    let createdCustomerId = null;

    test('GET /api/v1/customers should return paginated customers list', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.customers)).toBe(true);
    });

    test('POST /api/v1/customers should reject invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Test Client',
          email: 'not-an-email',
          phone: '+1-555-9988'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/customers should create customer with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Zeta Innovations',
          email: 'info@zetainnovations.com',
          phone: '+1-415-555-8822',
          company: 'Zeta Inc',
          status: 'Active'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Zeta Innovations');
      createdCustomerId = res.body.data.id;
    });

    test('GET /api/v1/customers/:id should return customer details and activity history', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.customer.id).toBe(createdCustomerId);
      expect(res.body.data.activities).toBeDefined();
    });
  });

  describe('Lead Workflow & Conversion API', () => {
    let leadId = null;

    test('POST /api/v1/leads should create a new lead with status New', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Enterprise Analytics Suite',
          contactPerson: 'Gregory House',
          email: 'ghouse@princetonplainsboro.org',
          phone: '+1-609-555-0144',
          company: 'Princeton Plainsboro',
          source: 'Website',
          status: 'New',
          priority: 'High'
        });

      expect(res.statusCode).toBe(201);
      leadId = res.body.data.id;
    });

    test('PUT /api/v1/leads/:id should advance status to Contacted then Qualified', async () => {
      const res1 = await request(app)
        .put(`/api/v1/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Enterprise Analytics Suite',
          contactPerson: 'Gregory House',
          email: 'ghouse@princetonplainsboro.org',
          phone: '+1-609-555-0144',
          status: 'Contacted'
        });
      expect(res1.statusCode).toBe(200);

      const res2 = await request(app)
        .put(`/api/v1/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Enterprise Analytics Suite',
          contactPerson: 'Gregory House',
          email: 'ghouse@princetonplainsboro.org',
          phone: '+1-609-555-0144',
          status: 'Qualified'
        });
      expect(res2.statusCode).toBe(200);
    });

    test('POST /api/v1/leads/:id/convert should atomically convert Qualified lead', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunityName: 'Princeton Analytics Rollout',
          amount: 60000,
          probability: 70
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.opportunity).toBeDefined();
    });
  });

  describe('Reporting API', () => {
    test('GET /api/v1/reports/pipeline should return stage-wise and owner-wise summaries', async () => {
      const res = await request(app)
        .get('/api/v1/reports/pipeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.stageSummary).toBeDefined();
      expect(res.body.data.ownerSummary).toBeDefined();
    });

    test('GET /api/v1/reports/conversion should return lead conversion metrics', async () => {
      const res = await request(app)
        .get('/api/v1/reports/conversion')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.conversionRate).toBeDefined();
      expect(res.body.data.winRate).toBeDefined();
    });
  });
});
