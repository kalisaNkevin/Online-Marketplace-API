import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return welcome message object', () => {
      const result = appController.getHello();
      expect(result).toEqual({
        message: 'Welcome to Jabo collection API!',
      });
    });

    it('should contain correct welcome message', () => {
      const result = appController.getHello();
      expect(result.message).toBe('Welcome to Jabo collection API!');
    });
  });
});
