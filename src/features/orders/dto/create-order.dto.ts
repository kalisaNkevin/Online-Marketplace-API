import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  ArrayMinSize,
  IsString,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';
import { PaymentDto } from './payment.dto';
import { ProductSize } from '@prisma/client';

export class ShippingAddressDto {
  @ApiProperty({
    description: 'Full name of recipient',
    example: 'John Doe',
  })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    description: 'Street address',
    example: 'KN 5 Rd',
  })
  @IsString()
  @Length(5, 100)
  street: string;

  @ApiProperty({
    description: 'Additional address details',
    example: 'Apartment 4B',
    required: false,
  })
  @IsString()
  @IsOptional()
  apartment?: string;

  @ApiProperty({
    description: 'City',
    example: 'Kigali',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Province/State',
    example: 'Kigali',
  })
  @IsString()
  province: string;

  @ApiProperty({
    description: 'Country',
    example: 'Rwanda',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+250780123456',
  })
  @IsString()
  phone: string;
}

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of product',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Product size',
    enum: ProductSize,
    required: false,
  })
  @IsEnum(ProductSize)
  @IsOptional()
  size?: ProductSize;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    description: 'Array of order items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    type: ShippingAddressDto,
    description: 'Shipping address details',
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    type: PaymentDto,
    description: 'Payment details',
  })
  @ValidateNested()
  @Type(() => PaymentDto)
  payment: PaymentDto;

  @ApiProperty({
    description: 'Additional order notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
