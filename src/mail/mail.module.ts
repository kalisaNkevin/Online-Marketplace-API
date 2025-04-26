import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const templatePath = join(process.cwd(), 'src/mail/templates');

        return {
          transport: {
            host: config.get('MAIL_HOST'),
            port: 465,
            secure: true,
            auth: {
              user: config.get('MAIL_USER'),
              pass: config.get('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: `"${config.get('MAIL_FROM_NAME')}" <${config.get('MAIL_USER')}>`,
          },
          template: {
            dir: templatePath,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
              minify: false,
            },
          },
          preview: false, // Disable preview to prevent local file opening
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
