import { ValidationPipe, Logger, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

@Injectable()
export class LoggerService extends Logger {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Trust proxy for rate limiting
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Update Helmet configuration
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        },
      },
    }),
  );

  // Update CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://online-marketplace-api-oqr9.onrender.com',
      'https://api.jabocollection.com',
      'https://jabocollection.com',
      'https://*.jabocollection.com', // Allow all subdomains
      process.env.FRONTEND_URL, // Add your frontend URL from env
    ].filter(Boolean), // Remove any undefined values
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Credentials',
      'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600
  });

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Online Marketplace API')
    .setVersion('1.0')
    .setDescription(
      'RESTful API for an online marketplace that allows users to buy and sell products, manage their inventory and process orders.',
    )
    .addTag('Authentication')
    .addServer('https://api.jabocollection.com', 'Production')
    .addServer('https://online-marketplace-api-oqr9.onrender.com', 'Staging')
    .addServer('http://localhost:3000', 'Development')

    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Access token for the API',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
