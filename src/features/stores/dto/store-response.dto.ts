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
  id: string;
  name: string;
  description: string;
  ownerId: string;
  owner: {
    name: string;
    email: string;
  };
  products: {
    id: string;
    name: string;
    price: Decimal;
  }[];
  metrics: {
    totalProducts: number;
    averageProductRating: number;
  };
  createdAt: Date;
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
