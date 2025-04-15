import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    example: 'iPhone 13 Pro',
    description: 'Product title'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Latest iPhone with pro camera system',
    description: 'Product description',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 999.99,
    description: 'Product price'
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number with up to 2 decimal places.' })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: 10,
    description: 'Optional discount percentage',
    required: false
  })
  @IsNumber({}, { message: 'Discount must be a number.' })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discount?: number;

  @ApiProperty({
    example: 100,
    description: 'Available quantity in stock'
  })
  @IsNumber({}, { message: 'Stock must be a number.' })
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    example: true,
    description: 'Whether the product is in stock',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID'
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Store ID'
  })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;
}
