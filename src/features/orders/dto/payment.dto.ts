import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.MOMO_MTN,
    description: 'Payment method'
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    example: '+250780123456',
    description: 'Mobile money number',
    required: false
  })
  @ValidateIf(o => o.method === PaymentMethod.MOMO_MTN || o.method === PaymentMethod.MOMO_AIRTEL)
  @IsString()
  phoneNumber?: string;
}