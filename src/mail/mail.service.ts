import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(user: User, verificationToken: string) {
    const verificationUrl = `${this.configService.get('APP_URL')}/auth/verify-email?token=${verificationToken}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Jabo Collection! Confirm your Email',
        template: './confirmation',
        context: {
          name: user.name,
          url: verificationUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email to ${user.email}`,
        error,
      );
      throw new Error('Failed to send confirmation email');
    }
  }
}
