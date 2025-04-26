import { ConfigService } from '@nestjs/config';
import { MailConfig } from '../interfaces/mail-config.interface';

export const getMailConfig = (config: ConfigService): MailConfig => ({
  host: config.get<string>('MAIL_HOST'),
  port: config.get<number>('MAIL_PORT', 587),
  secure: config.get<boolean>('MAIL_SECURE', false),
  user: config.get<string>('MAIL_USER'),
  password: config.get<string>('MAIL_PASSWORD'),
  from: config.get<string>('MAIL_FROM'),
  fromName: config.get<string>('MAIL_FROM_NAME', 'Jabo Collection'),
});
