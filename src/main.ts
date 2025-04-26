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
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Trust proxy for rate limiting
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Update Helmet configuration for subdomain
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`, 'https://*.jabocollection.com'],
          styleSrc: [
            `'self'`,
            `'unsafe-inline'`,
            'https://*.jabocollection.com',
          ],
          imgSrc: [
            `'self'`,
            'data:',
            'https://*.jabocollection.com',
            'https:',
            'http:',
          ],
          scriptSrc: [
            `'self'`,
            `'unsafe-inline'`,
            `'unsafe-eval'`,
            'https://*.jabocollection.com',
            'https://cdn.jsdelivr.net',
          ],
          connectSrc: [
            `'self'`,
            'https://*.jabocollection.com',
            'wss://*.jabocollection.com',
          ],
          fontSrc: [
            `'self'`,
            'https://*.jabocollection.com',
            'https:',
            'data:',
          ],
          objectSrc: [`'none'`],
          mediaSrc: [`'self'`, 'https://*.jabocollection.com'],
          frameSrc: [`'self'`, 'https://*.jabocollection.com'],
        },
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      'https://www.jabocollection.com',
      'https://jabocollection.com',
      /\.jabocollection\.com$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Jabo Collection API')
    .setVersion('1.0')
    .setDescription('The Jabo Collection API documentation')
    .addTag('Authentication')
    .addServer('https://api.jabocollection.com', 'Production')
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

  // Swagger UI CORS configuration
  app.use('/api-docs', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    next();
  });

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
    customSiteTitle: 'Jabo Collection API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application running on port ${port}`);
  logger.log(
    `API Documentation available at http://localhost:${port}/api-docs`,
  );
}

bootstrap().catch((err) => {
  console.error('Application failed to start:', err);
  process.exit(1);
});
