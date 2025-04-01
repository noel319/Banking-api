const request = require('supertest');
const server = require('../../src/server');
const db = require('../../src/models');
const { User } = db;

describe('Balance API', () => {
  let testUser;
  
  beforeAll(async () => {
    // Make sure we're using test database
    expect(process.env.NODE_ENV).toBe('test');
    
    // Clear users table and create test user
    await User.destroy({ where: {} });
    testUser = await User.create({
      balance: 10000,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  afterAll(async () => {
    // Close database connection
    await db.sequelize.close();
    // Close server
    server.close();
  });

  describe('GET /api/users/:userId', () => {
    it('should get user by ID', async () => {
      const res = await request(server)
        .get(`/api/users/${testUser.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUser.id);
      expect(parseFloat(res.body.data.balance)).toBe(10000);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = 999999;
      const res = await request(server)
        .get(`/api/users/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:userId/balance', () => {
    it('should increase balance', async () => {
      const res = await request(server)
        .put(`/api/users/${testUser.id}/balance`)
        .send({ amount: 50 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.balance)).toBe(10050);
      
      // Verify in database
      const updatedUser = await User.findByPk(testUser.id);
      expect(parseFloat(updatedUser.balance)).toBe(10050);
    });

    it('should decrease balance', async () => {
      const res = await request(server)
        .put(`/api/users/${testUser.id}/balance`)
        .send({ amount: -50 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.balance)).toBe(10000);
      
      // Verify in database
      const updatedUser = await User.findByPk(testUser.id);
      expect(parseFloat(updatedUser.balance)).toBe(10000);
    });

    it('should reject negative balance', async () => {
      const res = await request(server)
        .put(`/api/users/${testUser.id}/balance`)
        .send({ amount: -15000 })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Insufficient funds');
      
      // Verify balance has not changed
      const updatedUser = await User.findByPk(testUser.id);
      expect(parseFloat(updatedUser.balance)).toBe(10000);
    });

    it('should reject invalid amount format', async () => {
      const res = await request(server)
        .put(`/api/users/${testUser.id}/balance`)
        .send({ amount: 'invalid' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Concurrent balance updates', () => {
    it('should handle concurrent updates correctly', async () => {
      // Reset user balance to 10000
      await User.update(
        { balance: 10000 },
        { where: { id: testUser.id } }
      );
      
      // Create 50 concurrent requests to increase balance by 10 each
      const increasePromises = Array(50).fill().map(() => 
        request(server)
          .put(`/api/users/${testUser.id}/balance`)
          .send({ amount: 10 })
      );
      
      // Create 50 concurrent requests to decrease balance by 10 each
      const decreasePromises = Array(50).fill().map(() => 
        request(server)
          .put(`/api/users/${testUser.id}/balance`)
          .send({ amount: -10 })
      );
      
      // Execute all requests concurrently
      const results = await Promise.all([
        ...increasePromises,
        ...decreasePromises
      ]);
      
      // All requests should have succeeded
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
      
      // Final balance should be 10000
      const finalUser = await User.findByPk(testUser.id);
      expect(parseFloat(finalUser.balance)).toBe(10000);
    });
  });
});