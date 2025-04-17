import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @ApiOperation({ summary: 'Test email configuration' })
  async testEmail(@Body('to') to: string) {
    try {
      await this.emailService.sendEmail(
        to,
        'Test Email',
        '<h1>Test Email</h1><p>This is a test email from the API.</p>',
      );
      return { message: 'Test email sent successfully' };
    } catch (error) {
      console.error('Email Error:', error);
      throw error;
    }
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    await this.emailService.sendEmail(
      token,
      'Email Verification',
      `
      <h1>Email Verification</h1>`,
    );
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerification(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    // The service will handle token generation and sending
    await this.emailService.sendVerificationEmail(email, 'new-token');
    return { message: 'Verification email sent' };
  }
}
