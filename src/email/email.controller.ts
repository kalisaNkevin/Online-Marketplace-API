import { 
  Controller, 
  Post, 
  Body, 
  Logger,
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse 
} from '@nestjs/swagger';

import { EmailService } from './email.service';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { SendTestEmailDto, EmailTestType } from './dto/send-test-email.dto';
import { AdminGuard } from '@/auth/guards/admin.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guards';

@ApiTags('Email Testing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('email-test')
export class EmailTestController {
  private readonly logger = new Logger(EmailTestController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ 
    summary: 'Send test email',
    description: 'Admin only endpoint to test email functionality'
  })
  @ApiBody({ type: SendTestEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Test verification email sent to user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email or type',
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - requires admin role' 
  })
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    try {
      const result = await this.emailService.sendVerificationEmail(dto.email, 'test-token');
      return {
        success: result.success,
        message: `Email ${result.success ? 'sent' : 'failed'} to ${dto.email}`,
        ...(result.messageId && { messageId: result.messageId }),
        ...(result.error && { error: result.error }),
      };
    } catch (error) {
      this.logger.error(`Failed to send test email: ${error}`);
      throw error;
    }
  }

  @Post('test-templates')
  @ApiOperation({ summary: 'Test all email templates' })
  async testTemplates(@Body('email') email: string) {
    const testData = {
      orderNumber: 'TEST-123',
      items: [
        {
          productName: 'Test Product',
          quantity: 1,
          price: 99.99,
          total: 99.99
        }
      ],
      total: 99.99,
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'Test Country',
        postalCode: '12345'
      }
    };

    await this.emailService.sendOrderConfirmation(email, testData);
    await this.emailService.sendOrderStatusUpdate({
      to: email,
      orderNumber: 'TEST-123',
      status: 'PROCESSING',
      items: testData.items,
      total: testData.total
    });
    await this.emailService.sendPaymentConfirmation({
      to: email,
      orderNumber: 'TEST-123',
      amount: testData.total,
      paymentMethod: 'CARD'
    });

    return { message: 'Test emails sent successfully' };
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test SMTP connection' })
  async testConnection() {
    try {
      await this.emailService.verifyConnection();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}