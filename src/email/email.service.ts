import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  EmailResult,
  OrderDetails,
  OrderStatusUpdateParams,
  PaymentConfirmationParams,
} from './interfaces/email.interfaces';
import { EmailTemplates } from './templates/email.templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    // Updated transporter configuration with proper TLS settings
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      requireTLS: true, // Force TLS
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // Only use this in development
      },
    });

    this.fromEmail = this.configService.get<string>('MAIL_FROM_ADDRESS');
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME');

    // Verify SMTP connection on service initialization
    this.verifyConnection();
  }

  public async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection established successfully');
    } catch (error) {
      this.logger.error(`SMTP connection failed: ${error}`);
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });

      this.logger.log(
        `Email sent successfully to ${to} (ID: ${info.messageId})`,
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<EmailResult> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const html = EmailTemplates.getVerificationEmail(frontendUrl, token);
    return this.sendEmail(email, 'Verify Your Email', html);
  }

  async sendWelcomeEmail(email: string): Promise<EmailResult> {
    const html = EmailTemplates.getWelcomeEmail();
    return this.sendEmail(email, 'Welcome to Our Service', html);
  }

  async sendOrderConfirmation(
    email: string,
    orderDetails: OrderDetails,
  ): Promise<EmailResult> {
    const html = EmailTemplates.getOrderConfirmation(orderDetails);
    return this.sendEmail(email, 'Order Confirmation', html);
  }

  async sendOrderStatusUpdate(
    params: OrderStatusUpdateParams,
  ): Promise<EmailResult> {
    const html = EmailTemplates.getOrderStatusUpdate(params);
    return this.sendEmail(
      params.to,
      `Order ${params.orderNumber} Status Update`,
      html,
    );
  }

  async sendPaymentConfirmation(
    params: PaymentConfirmationParams,
  ): Promise<EmailResult> {
    const html = EmailTemplates.getPaymentConfirmation(params);
    return this.sendEmail(
      params.to,
      `Payment Confirmation - Order ${params.orderNumber}`,
      html,
    );
  }
}
