import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CachedOrder } from 'src/features/orders/interfaces/order.interface';

@Injectable()
export class RedisService {
  constructor(
    @InjectQueue('orders') private readonly orderQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async addOrderToQueue(data: any) {
    return await this.orderQueue.add('process-order', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async cacheOrderDetails(orderId: string, data: CachedOrder): Promise<void> {
    await this.cacheManager.set(`order:${orderId}`, data, 3600000); // 1 hour
  }

  async getCachedOrderDetails(orderId: string): Promise<CachedOrder | null> {
    const cached = await this.cacheManager.get<CachedOrder>(`order:${orderId}`);
    return cached || null;
  }
}
