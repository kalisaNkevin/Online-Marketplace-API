import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EmailTestType {
  VERIFICATION = 'verification',
  WELCOME = 'welcome',
  ORDER = 'order',
  STATUS = 'status',
  PAYMENT = 'payment',
}

export class SendTestEmailDto {
  @ApiProperty({
    description: 'Email address to send the test email to',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Type of test email to send',
    enum: EmailTestType,
    example: EmailTestType.VERIFICATION,
  })
  @IsEnum(EmailTestType)
  type: EmailTestType;
}
