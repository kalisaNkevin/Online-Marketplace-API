import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class StoreProductDto {
  @ApiProperty({ example: 'product-123' })
  id: string;

  @ApiProperty({ example: 'Nike Air Max' })
  name: string;

  @ApiProperty({ example: 90 })
  price: number ;

  @ApiProperty({ example: 90 })
  averageRating?: number;
}

export class StoreOwnerDto {
  @ApiProperty({ example: 'owner-123' })
  id: string;

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
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  logoUrl?: string;

  @ApiProperty()
  owner: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ type: [Object] })
  products: Array<{
    id: string;
    name: string;
    price: number;
    averageRating?: number;
  }>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
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
