import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { ProductSize } from '@prisma/client';

export class StoreDto {
  @ApiProperty({ example: 'store-123' })
  id: string;

  @ApiProperty({ example: 'Fashion Store' })
  name: string;
}

export class CategoryDto {
  @ApiProperty({ example: 'category-123' })
  id: string;

  @ApiProperty({ example: 'Clothing' })
  name: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: Decimal;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ required: false, nullable: true })
  discount: Decimal | null;

  @ApiProperty({ required: false, nullable: true })
  thumbnail: string | null;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  store: {
    id: string;
    name: string;
  } | null;

  @ApiProperty({ type: [Object] })
  categories: Array<{
    id: string;
    name: string;
  }>;

  @ApiProperty({ type: [Object] })
  variants: Array<{
    size: string;
    quantity: number;
  }>;

  @ApiProperty({ type: [Object] })
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    user: {
      id: string;
      name: string;
    };
  }>;

  @ApiProperty({ required: false, nullable: true })
  averageRating: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedProductsResponse {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty()
  filters: {
    appliedCategory: string | null;
    priceRange: {
      min: number | null;
      max: number | null;
    };
    ratingFilter: number | null;
  };
}
