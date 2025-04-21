import { Test } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getQueueToken } from '@nestjs/bull';

describe('RedisService', () => {
  let service: RedisService;
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockBullQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: getQueueToken('orders'),
          useValue: mockBullQueue,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    jest.clearAllMocks();
  });

  describe('Redis Operations', () => {
    it('should set a string value in cache', async () => {
      const key = 'test-key';
      const value = 'test-data';
      const ttl = 3600;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl * 1000);
    });

    it('should set a JSON value in cache', async () => {
      const key = 'test-key';
      const value = JSON.stringify({ test: 'data' });
      const ttl = 3600;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl * 1000);
    });

    it('should get a value from cache', async () => {
      const key = 'test-key';
      const value = 'test-data';
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should delete a value from cache', async () => {
      const key = 'test-key';
      await service.del(key);
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    describe('Error Handling', () => {
      it('should handle cache errors on get', async () => {
        mockCacheManager.get.mockRejectedValueOnce(new Error('Redis Error'));
        await expect(service.get('key')).rejects.toThrow('Redis Error');
      });

      it('should handle cache errors on set', async () => {
        mockCacheManager.set.mockRejectedValueOnce(new Error('Redis Error'));
        await expect(service.set('key', 'value', 3600)).rejects.toThrow(
          'Redis Error',
        );
      });
    });

    describe('Protected Routes', () => {
      beforeEach(() => {
        mockCacheManager.set.mockResolvedValue(undefined);
        mockCacheManager.get.mockResolvedValue(null);
      });

      it('should handle rate limiting', async () => {
        const key = 'rate-limit:user123';
        mockCacheManager.get.mockResolvedValueOnce('5');

        await service.set(key, '5', 3600);
        const attempts = await service.get(key);

        expect(attempts).toBe('5');
        expect(mockCacheManager.set).toHaveBeenCalledWith(key, '5', 3600000);
      });

      it('should handle auth token caching', async () => {
        const key = 'auth:token123';
        const token = 'jwt-token-123';

        await service.set(key, token, 3600);
        mockCacheManager.get.mockResolvedValueOnce(token);

        const cachedToken = await service.get(key);
        expect(cachedToken).toBe(token);
      });

      it('should handle session data', async () => {
        const key = 'session:user123';
        const sessionData = JSON.stringify({ userId: '123', role: 'user' });

        await service.set(key, sessionData, 3600);
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          key,
          sessionData,
          3600000,
        );
      });
    });
  });

  describe('Queue Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should add job to queue', async () => {
      const jobData = { orderId: '123' };
      mockBullQueue.add.mockResolvedValue(undefined);

      await service.addToQueue('processOrder', jobData);

      expect(mockBullQueue.add).toHaveBeenCalledWith('processOrder', jobData);
    });

    it('should handle queue errors', async () => {
      mockBullQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(service.addToQueue('processOrder', {})).rejects.toThrow(
        'Queue error',
      );
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
