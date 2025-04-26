import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'APP_URL') return 'http://localhost:3000';
              return 'mock-value';
            }),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterAll(async () => {
    // Close any open handles
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        resolve(true);
      }, 500);
      timeout.unref();
    });
  });

  describe('sendUserConfirmation', () => {
    it('should send welcome email successfully', async () => {
      const user = {
        email: 'support@jabocollection.com',
        name: 'Test User',
      };
      const token = 'verification-token';

      await mailService.sendUserConfirmation(user as any, token);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: user.email,
        subject: 'Welcome to Jabo Collection! Confirm your Email',
        template: './confirmation',
        context: {
          name: user.name,
          url: `http://localhost:3000/auth/verify-email?token=${token}`,
        },
      });
    });

    it('should handle mailer errors', async () => {
      const user = {
        email: 'support@jabocollection.com',
        name: 'Test User',
      };

      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error('Failed to send confirmation email'));

      await expect(
        mailService.sendUserConfirmation(user as any, 'token'),
      ).rejects.toThrow('Failed to send confirmation email');
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should handle failed email sending gracefully', async () => {
      const email = 'support@jabocollection.com';
      const token = 'test-token';

      // Mock the mailerService to simulate failure
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error('Failed to send confirmation email'));

      // Use expect().rejects instead of try-catch for cleaner test
      await expect(
        mailService.sendUserConfirmation(
          {
            email,
            name: 'Test User',
          } as any,
          token,
        ),
      ).rejects.toThrow('Failed to send confirmation email');

      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });
});
