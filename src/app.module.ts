import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersController } from './features/orders/orders.controller';
import { OrdersModule } from './features/orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './features/products/products.module';
import { UploadsModule } from './features/uploads/uploads.module';
import { RatingsModule } from './features/ratings/ratings.module';
import { SubscriptionsModule } from './features/subscriptions/subscriptions.module';
import { CartModule } from './features/cart/cart.module';
import { PaymentsModule } from './features/payments/payments.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { Store } from 'express-session';
import { StoresModule } from './features/stores/stores.module';
import { CategoryModule } from './features/categories/categories.module';

@Module({
  imports: [
    OrdersModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SubscriptionsModule,
    UploadsModule,
    RatingsModule,
    CartModule,
    StoresModule,
    CategoryModule,
    PaymentsModule,
    PrismaModule,
    CacheModule.register({
      ttl: 60 * 60, // 1 hour
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, OrdersController],
  providers: [AppService],
})
export class AppModule {}