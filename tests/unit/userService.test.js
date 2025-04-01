const db = require('../../src/models');
const userService = require('../../src/services/userService');
const { User } = db;

describe('UserService', () => {
  let testUser;
  
  beforeAll(async () => {    
    expect(process.env.NODE_ENV).toBe('test');
  });

  beforeEach(async () => {    
    await User.destroy({ where: {} });
    testUser = await User.create({
      balance: 10000,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  afterAll(async () => {    
    await db.sequelize.close();
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      const user = await userService.getUserById(testUser.id);
      expect(user).toBeTruthy();
      expect(user.id).toBe(testUser.id);
      expect(parseFloat(user.balance)).toBe(10000);
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.getUserById(999999)).rejects.toThrow('User not found');
    });
  });

  describe('updateBalance', () => {
    it('should increase balance', async () => {
      const updatedUser = await userService.updateBalance(testUser.id, 500);
      expect(parseFloat(updatedUser.balance)).toBe(10500);      
      
      const dbUser = await User.findByPk(testUser.id);
      expect(parseFloat(dbUser.balance)).toBe(10500);
    });

    it('should decrease balance', async () => {
      const updatedUser = await userService.updateBalance(testUser.id, -500);
      expect(parseFloat(updatedUser.balance)).toBe(9500);      
      
      const dbUser = await User.findByPk(testUser.id);
      expect(parseFloat(dbUser.balance)).toBe(9500);
    });

    it('should reject negative balance', async () => {
      await expect(userService.updateBalance(testUser.id, -15000)).rejects.toThrow('Insufficient funds');      
      
      const dbUser = await User.findByPk(testUser.id);
      expect(parseFloat(dbUser.balance)).toBe(10000);
    });

    it('should handle concurrent updates correctly', async () => {      
      const updatePromises = [];      
      
      for (let i = 0; i < 50; i++) {
        updatePromises.push(userService.updateBalance(testUser.id, 100));
      }      
   
      for (let i = 0; i < 50; i++) {
        updatePromises.push(userService.updateBalance(testUser.id, -100));
      }      
      
      await Promise.all(updatePromises);      
      
      const finalUser = await User.findByPk(testUser.id);
      expect(parseFloat(finalUser.balance)).toBe(10000);
    });
  });
});