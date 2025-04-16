import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Cart ID to checkout' })
  @IsUUID()
  cartId: string;

  @ApiProperty({
    description: 'Phone number for payment',
    example: '250781234567',
  })
  @IsString()
  @Matches(/^250[7][238]\d{7}$/, {
    message: 'Phone number must be in format 250XXXXXXXXX',
  })
  phone: string;
}
