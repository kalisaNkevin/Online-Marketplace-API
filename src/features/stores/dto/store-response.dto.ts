import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class StoreProductDto {
  @ApiProperty({ example: 'product-123' })
  id: string;

  @ApiProperty({ example: 'Nike Air Max' })
  name: string;

  @ApiProperty({ example: 129.99 })
  price: Decimal;
}

export class StoreOwnerDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;
}

export class StoreMetricsDto {
  @ApiProperty({ example: 10 })
  totalProducts: number;

  @ApiProperty({ example: 4.5 })
  averageProductRating: number;
}

export class StoreResponseDto {
  @ApiProperty({ example: 'store-123' })
  id: string;

  @ApiProperty({ example: 'Fashion Store' })
  name: string;

  @ApiProperty({ required: false, example: 'Best fashion store in town' })
  description?: string;

  @ApiProperty({ example: 'user-123' })
  ownerId: string;

  @ApiProperty({ type: StoreOwnerDto })
  owner?: StoreOwnerDto;

  @ApiProperty({ type: [StoreProductDto] })
  products: StoreProductDto[];

  @ApiProperty({ type: StoreMetricsDto })
  metrics?: StoreMetricsDto;

  @ApiProperty({ example: '2025-04-18T06:29:05.249Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-04-18T06:29:05.249Z' })
  updatedAt: Date;
}

export class PaginatedStoresResponse {
  @ApiProperty({ type: [StoreResponseDto] })
  data: StoreResponseDto[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
