import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../database/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { EmailModule } from 'src/email/email.module';


@Module({
  imports: [PrismaModule, RedisModule, EmailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
