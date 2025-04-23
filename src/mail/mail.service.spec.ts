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

  describe('sendUserConfirmation', () => {
    it('should send welcome email successfully', async () => {
      const user = {
        email: 'test@example.com',
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
        email: 'test@example.com',
        name: 'Test User',
      };

      jest.spyOn(mailerService, 'sendMail').mockRejectedValue(new Error('Failed to send confirmation email'));

      await expect(
        mailService.sendUserConfirmation(user as any, 'token'),
      ).rejects.toThrow('Failed to send confirmation email');
    });
  });
});
