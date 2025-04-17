import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export const mailConfig = (configService: ConfigService): MailerOptions => ({
  transport: {
    host: configService.get('MAILGUN_SMTP_SERVER'),
    port: parseInt(configService.get('MAILGUN_SMTP_PORT')),
    secure: false, // true for 465, false for other ports
    auth: {
      user: configService.get('MAILGUN_SMTP_LOGIN'),
      pass: configService.get('MAILGUN_SMTP_PASSWORD'),
    },
    debug: true, // Add this for debugging
    logger: true, // Add this for debugging
  },
  defaults: {
    from: `"No Reply" <${configService.get('MAILGUN_FROM_EMAIL')}>`,
  },
});
