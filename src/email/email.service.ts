import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    await this.sendEmail(
      email,
      'Verify Your Email',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${frontendUrl}/verify-email?token=${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </div>
      `,
    );
  }

  async sendWelcomeEmail(email: string) {
    await this.sendEmail(
      email,
      'Welcome to Our Service',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome!</h2>
          <p>Thank you for joining us. We are excited to have you on board.</p>
        </div>
      `,
    );
  }

  async sendOrderConfirmation(email: string, orderDetails: any) {
    await this.sendEmail(
      email,
      'Order Confirmation',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmation</h2>
          <p>Thank you for your order! Here are your order details:</p>
          <pre>${JSON.stringify(orderDetails, null, 2)}</pre>
        </div>
      `,
    );
  }
}
