import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import { OrderProcessor } from './processors/order.processor';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EmailModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'orders',
    }),
  ],
  providers: [RedisService, OrderProcessor],
  exports: [RedisService],
})
export class RedisModule {}
