const redis = require('../../src/utils/redis');

describe('Redis Utils', () => {
  const testKey = 'test:key';
  const testValue = { name: 'Test User', balance: 1000 };
  
  // Clean up after tests
  afterAll(async () => {
    await redis.del(testKey);
    await redis.close();
  });
  
  it('should set and get a value', async () => {
    // Set a value
    const setResult = await redis.set(testKey, testValue);
    expect(setResult).toBe(true);
    
    // Get the value
    const getValue = await redis.get(testKey);
    expect(getValue).toEqual(testValue);
  });
  
  it('should return null for non-existent key', async () => {
    const result = await redis.get('non:existent:key');
    expect(result).toBeNull();
  });
  
  it('should delete a key', async () => {
    // Set a value
    await redis.set(testKey, testValue);
    
    // Delete the key
    const deleteResult = await redis.del(testKey);
    expect(deleteResult).toBe(true);
    
    // Verify it's gone
    const getResult = await redis.get(testKey);
    expect(getResult).toBeNull();
  });
});