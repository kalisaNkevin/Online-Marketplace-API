import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../../database/prisma.module';
// import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    // RedisModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
