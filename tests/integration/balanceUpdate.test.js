const request = require('supertest');
const server = require('../../src/server');
const db = require('../../src/models');
const { User } = db;

describe('Balance API', () => {
  let testUser;
  
  beforeAll(async () => {
    
    expect(process.env.NODE_ENV).toBe('test');    
    await User.destroy({ where: {} });
    testUser = await User.create({
      balance: 10000,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  afterAll(async () => {    
    await db.sequelize.close();   
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
      
      await User.update(
        { balance: 10000 },
        { where: { id: testUser.id } }
      );
     
      const increasePromises = Array(50).fill().map(() => 
        request(server)
          .put(`/api/users/${testUser.id}/balance`)
          .send({ amount: 10 })
      );      
      
      const decreasePromises = Array(50).fill().map(() => 
        request(server)
          .put(`/api/users/${testUser.id}/balance`)
          .send({ amount: -10 })
      );      
      
      const results = await Promise.all([
        ...increasePromises,
        ...decreasePromises
      ]);      
     
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });      
      
      const finalUser = await User.findByPk(testUser.id);
      expect(parseFloat(finalUser.balance)).toBe(10000);
    });
  });
});