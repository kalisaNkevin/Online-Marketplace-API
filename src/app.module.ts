import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersController } from './features/orders/orders.controller';
import { OrdersModule } from './features/orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './features/products/products.module';
import { UploadsModule } from './features/uploads/uploads.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { StoresModule } from './features/stores/stores.module';
import { CategoryModule } from './features/categories/categories.module';
import { MailModule } from './mail/mail.module';


@Module({
  imports: [
    OrdersModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    UploadsModule,
    StoresModule,
    CategoryModule,
    PrismaModule,

    CacheModule.register({
      ttl: 60 * 60,
    }),
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),

    MailModule,
  ],
  controllers: [AppController, OrdersController],
  providers: [AppService],
})
export class AppModule {}
