import { Injectable, Logger } from '@nestjs/common';
import * as sendgrid from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    sendgrid.setApiKey(this.configService.get('SENDGRID_API_KEY'));
  }

  async sendPasswordReset(email: string, token: string) {
    try {
      this.logger.log(`Sending password reset email to ${email}`);
      
      const msg = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Use this token: ${token}</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      };

      await sendgrid.send(msg);
      this.logger.log(`Successfully sent password reset email to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordChangeConfirmation(email: string) {
    try {
      this.logger.log(`Sending password change confirmation to ${email}`);
      
      const msg = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: 'Password Changed Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Changed</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Time of change: ${new Date().toLocaleString()}</p>
          </div>
        `,
      };

      await sendgrid.send(msg);
      this.logger.log(`Successfully sent password change confirmation to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password change confirmation to ${email}:`, error);
      throw error;
    }
  }
}