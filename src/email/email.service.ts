import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { OrderStatus, PaymentMethod } from '@prisma/client';

interface OrderStatusUpdateParams {
  to: string;
  orderNumber: string;
  status: OrderStatus;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

interface PaymentConfirmationParams {
  to: string;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

interface OrderDetails {
  orderNumber: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail = this.configService.get<string>('MAIL_FROM_ADDRESS');
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        from: this.fromEmail,
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
    const html = this.getVerificationEmailTemplate(frontendUrl, token);
    await this.sendEmail(email, 'Verify Your Email', html);
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    const html = this.getWelcomeEmailTemplate();
    await this.sendEmail(email, 'Welcome to Our Service', html);
  }

  async sendOrderConfirmation(email: string, orderDetails: OrderDetails): Promise<void> {
    const html = this.getOrderConfirmationTemplate(orderDetails);
    await this.sendEmail(email, 'Order Confirmation', html);
  }

  async sendOrderStatusUpdate(params: OrderStatusUpdateParams): Promise<void> {
    const html = this.getOrderStatusTemplate(params);
    await this.sendEmail(
      params.to,
      `Order ${params.orderNumber} Status Update`,
      html,
    );
  }

  async sendPaymentConfirmation(params: PaymentConfirmationParams): Promise<void> {
    const html = this.getPaymentConfirmationTemplate(params);
    await this.sendEmail(
      params.to,
      `Payment Confirmation - Order ${params.orderNumber}`,
      html,
    );
  }

  private getVerificationEmailTemplate(frontendUrl: string, token: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${frontendUrl}/verify-email?token=${token}" 
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </div>
    `;
  }

  private getWelcomeEmailTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome!</h2>
        <p>Thank you for joining us. We are excited to have you on board.</p>
      </div>
    `;
  }

  private getOrderConfirmationTemplate(orderDetails: OrderDetails): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order #${orderDetails.orderNumber}!</p>
        <h3>Order Details:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left;">Product</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.items.map(item => `
              <tr>
                <td style="padding: 8px 0;">${item.productName}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="text-align: right;">$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3" style="text-align: right; padding-top: 16px;"><strong>Total:</strong></td>
              <td style="text-align: right; padding-top: 16px;"><strong>$${orderDetails.total.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        <h3>Shipping Address:</h3>
        <p>
          ${orderDetails.shippingAddress.street}<br>
          ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.postalCode}<br>
          ${orderDetails.shippingAddress.country}
        </p>
      </div>
    `;
  }

  private getOrderStatusTemplate(params: OrderStatusUpdateParams): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Status Update</h2>
        <p>Order: #${params.orderNumber}</p>
        <p>Status: <strong>${params.status}</strong></p>
        <h3>Order Items:</h3>
        <ul>
          ${params.items.map(item => `
            <li>${item.quantity}x ${item.productName} - $${item.price.toFixed(2)}</li>
          `).join('')}
        </ul>
        <p><strong>Total: $${params.total.toFixed(2)}</strong></p>
      </div>
    `;
  }

  private getPaymentConfirmationTemplate(params: PaymentConfirmationParams): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Order: #${params.orderNumber}</p>
        <p>Amount: $${params.amount.toFixed(2)}</p>
        <p>Payment Method: ${params.paymentMethod}</p>
      </div>
    `;
  }
}
