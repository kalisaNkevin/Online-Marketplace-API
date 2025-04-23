import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getMailConfig } from './mail.config';

describe('MailConfig', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MAIL_HOST: 'smtp.gmail.com',
                MAIL_PORT: 587,
                MAIL_SECURE: false,
                MAIL_USER: 'test@gmail.com',
                MAIL_PASSWORD: 'password123',
                MAIL_FROM: 'noreply@jabocollection.com',
                MAIL_FROM_NAME: 'Jabo Collection',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should return mail configuration', () => {
    const mailConfig = getMailConfig(configService);

    expect(mailConfig).toEqual({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: 'test@gmail.com',
      password: 'password123',
      from: 'noreply@jabocollection.com',
      fromName: 'Jabo Collection',
    });
  });
});
