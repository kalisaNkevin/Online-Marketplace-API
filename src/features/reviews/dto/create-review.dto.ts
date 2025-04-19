import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating from 1-5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;
  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;
}
