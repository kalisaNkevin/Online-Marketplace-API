import { IsString, IsNumber, IsArray, IsOptional, Min, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Brand name' })
  @IsString()
  brand: string;

  @ApiProperty({ description: 'Current price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Original price before discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ description: 'Product thumbnail URL' })
  @IsString()
  thumbnail: string;

  @ApiProperty({ description: 'Available sizes', example: ['S', 'M', 'L'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sizes: string[];

  @ApiProperty({ description: 'Product color' })
  @IsString()
  color: string;

  @ApiProperty({ description: 'Available stock' })
  @IsNumber()
  @Min(0)
  stock: number;
}