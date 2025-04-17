import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean, IsArray, Min, MaxLength } from 'class-validator';
import { ProductSize as PrismaProductSize } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Product Name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ type: [String], description: 'Category IDs' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds: string[];

  @ApiProperty({ enum: PrismaProductSize, isArray: true, enumName: 'PrismaProductSize' })
  @IsArray()
  variants: PrismaProductSize[];

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
