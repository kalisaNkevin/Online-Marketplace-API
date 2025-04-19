import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CachedOrder } from 'src/features/orders/interfaces/order.interface';
import { OrderEntity } from '../features/orders/entities/order.entity';

@Injectable()
export class RedisService {
  constructor(
    @InjectQueue('orders') private readonly orderQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
  }

  async get(key: string): Promise<string | null> {
    return await this.cacheManager.get<string>(key);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async addOrderToQueue(
    order: OrderEntity,
    userId: string,
    operation: 'process-order' | 'process-payment',
  ) {
    return await this.orderQueue.add(
      operation,
      { order, userId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async invalidateOrderCache(orderId: string): Promise<void> {
    await this.del(`order:${orderId}`);
  }

  async cacheOrder(order: OrderEntity): Promise<void> {
    await this.set(`order:${order.id}`, JSON.stringify(order), 3600); // 1 hour
  }

  async getCachedOrder(orderId: string): Promise<OrderEntity | null> {
    const cached = await this.get(`order:${orderId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateUserOrders(userId: string): Promise<void> {
    await this.del(`user:${userId}:orders`);
  }

  async invalidateStoreOrders(storeId: string): Promise<void> {
    await this.del(`store:${storeId}:orders`);
  }
}
