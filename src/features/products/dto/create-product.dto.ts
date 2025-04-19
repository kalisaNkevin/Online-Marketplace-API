import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUrl,
  IsBoolean,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSize } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductVariantDto {
  @ApiProperty({
    enum: ProductSize,
    example: 'M',
    description: 'Product size variant',
  })
  @IsEnum(ProductSize)
  size: ProductSize;

  @ApiProperty({
    example: 10,
    description: 'Quantity available for this size',
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Nike Air Max 2023' })
  @IsString()
  name: string;

  @ApiProperty({
    required: false,
    example: 'Premium comfort sneakers with air cushioning',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '199.99' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    required: false,
    example: '20.00',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    required: false,
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsUrl()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['https://example.com/image1.jpg'],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    type: [String],
    example: ['b7f80a2f-525d-4775-8ae4-9463795cecda'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  categories: string[];

  @ApiProperty({
    type: [ProductVariantDto],
    example: [{ size: 'M', quantity: 10 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @ArrayMinSize(1)
  variants: ProductVariantDto[];

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
