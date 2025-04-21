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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StoresModule } from './features/stores/stores.module';
import { CategoryModule } from './features/categories/categories.module';
import { MailerModule } from '@nestjs-modules/mailer';

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
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: config.get<number>('SMTP_PORT'),
          secure: config.get<boolean>('SMTP_SECURE'),
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"${config.get<string>('MAIL_FROM_NAME')}" <${config.get<string>('MAIL_FROM_ADDRESS')}>`,
        },
      }),
    }),
  ],
  controllers: [AppController, OrdersController],
  providers: [AppService],
})
export class AppModule {}
