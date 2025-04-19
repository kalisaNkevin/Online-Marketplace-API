import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductEntity {
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

  @ApiProperty({ nullable: true })
  discount: Decimal | null;

  @ApiProperty({ nullable: true })
  thumbnail: string | null;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  storeId: string;

  @ApiProperty({ type: Object, nullable: true })
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

  @ApiProperty({ nullable: true })
  averageRating: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
