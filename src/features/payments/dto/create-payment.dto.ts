import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID to pay for' })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Phone number in format 250XXXXXXXXX',
    example: '250781234567',
  })
  @IsString()
  @Matches(/^250[7][238]\d{7}$/, {
    message: 'Phone number must be in format 250XXXXXXXXX',
  })
  phone: string;
}
