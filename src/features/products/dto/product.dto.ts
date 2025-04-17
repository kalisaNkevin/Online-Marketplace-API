import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Decimal } from '@prisma/client/runtime/library';

export class StoreDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;
}

export class CategoryDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;
}

export class ProductVariantDto {
  @ApiProperty()
  @IsString()
  size: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class ProductMetricsDto {
  @ApiProperty()
  @IsNumber()
  totalReviews: number;

  @ApiProperty()
  @IsNumber()
  totalOrders: number;

  @ApiProperty()
  @Type(() => Number)
  averageRating: Decimal;
}

export class ProductResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  price: Decimal;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ type: StoreDto })
  @ValidateNested()
  @Type(() => StoreDto)
  store: StoreDto;

  @ApiProperty({ type: [CategoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];

  @ApiProperty({ type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @ApiProperty({ type: ProductMetricsDto })
  @ValidateNested()
  @Type(() => ProductMetricsDto)
  @IsOptional()
  metrics?: ProductMetricsDto;
}