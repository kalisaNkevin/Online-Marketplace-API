import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @ApiProperty({
    required: false,
    description: 'Search term for product title or description'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by store ID'
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by category ID'
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by in stock status'
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean;

  @ApiProperty({
    required: false,
    minimum: 0,
    description: 'Minimum price filter'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    required: false,
    minimum: 0,
    description: 'Maximum price filter'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    required: false,
    minimum: 0,
    description: 'Minimum rating filter'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRating?: number;

  @ApiProperty({
    required: false,
    minimum: 1,
    default: 1,
    description: 'Page number'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    minimum: 1,
    default: 10,
    description: 'Items per page'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, enum: ['createdAt', 'price', 'averageRating'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
