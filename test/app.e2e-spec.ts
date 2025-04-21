import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from './setup';
import { PrismaService } from '../src/database/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testSetup = await setupTestApp();
    app = testSetup.app;
    prisma = testSetup.prisma;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Welcome to Jabo collection API!');
  });
});
