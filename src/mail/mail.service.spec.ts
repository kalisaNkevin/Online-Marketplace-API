import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;
  let configService: ConfigService;

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue(true),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'APP_URL':
          return 'example.com';
        case 'MAIL_FROM':
          return 'noreply@jabocollection.com';
        case 'MAIL_FROM_NAME':
          return 'Nice App';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
    expect(mailerService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('sendUserConfirmation', () => {
    it('should send confirmation email', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'hashedPassword',
        phoneNumber: '',
        address: '',
        city: '',
        country: '',
        postalCode: '',
        avatar: '',
        dateOfBirth: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
        verificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      };
      const token = 'test-verification-token';

      await mailService.sendUserConfirmation(user as any, token);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: user.email,
        subject: 'Welcome to Nice App! Confirm your Email',
        template: './transactional',
        context: {
          name: user.name,
          url: `example.com/auth/confirm?token=${token}`,
        },
      });
    });
  });
});
