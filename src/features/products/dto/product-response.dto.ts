import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { ProductSize } from '@prisma/client';

export class StoreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ProductMetricsDto {
  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  averageRating: Decimal;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  price: Decimal;

  @ApiProperty({ required: false })
  quantity?: number;

  @ApiProperty({ required: false })
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  store?: StoreDto;

  @ApiProperty({ type: [CategoryDto], required: false })
  categories?: CategoryDto[];

  @ApiProperty({ type: [String], required: false })
  categoryIds?: string[];

  @ApiProperty({ enum: ProductSize, isArray: true, required: false })
  variants?: ProductSize[];

  @ApiProperty()
  metrics?: ProductMetricsDto;
}

export class PaginatedProductsResponse {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty()
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
