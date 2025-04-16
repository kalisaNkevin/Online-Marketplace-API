import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersController } from './features/orders/orders.controller';
import { OrdersModule } from './features/orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './features/products/products.module';
import { UploadsModule } from './features/uploads/uploads.module';
import { PaymentsModule } from './features/payments/payments.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { StoresModule } from './features/stores/stores.module';
import { CategoryModule } from './features/categories/categories.module';
import { ReviewsModule } from './features/reviews/reviews.module';
import { CheckoutModule } from './features/checkout/checkout.module';

@Module({
  imports: [
    OrdersModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    UploadsModule,
    StoresModule,
    CategoryModule,
    PaymentsModule,
    PrismaModule,
    CheckoutModule,
    ReviewsModule,
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
