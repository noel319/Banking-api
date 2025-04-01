const redis = require('../../src/utils/redis');

describe('Redis Utils', () => {
  const testKey = 'test:key';
  const testValue = { name: 'Test User', balance: 1000 };  
  
  afterAll(async () => {
    await redis.del(testKey);
    await redis.close();
  });
  
  it('should set and get a value', async () => {
    
    const setResult = await redis.set(testKey, testValue);
    expect(setResult).toBe(true);    
   
    const getValue = await redis.get(testKey);
    expect(getValue).toEqual(testValue);
  });
  
  it('should return null for non-existent key', async () => {
    const result = await redis.get('non:existent:key');
    expect(result).toBeNull();
  });
  
  it('should delete a key', async () => {    
    await redis.set(testKey, testValue);    
   
    const deleteResult = await redis.del(testKey);
    expect(deleteResult).toBe(true);    
   
    const getResult = await redis.get(testKey);
    expect(getResult).toBeNull();
  });
});