import { ApiProperty } from '@nestjs/swagger';

export class ReviewEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ format: 'uuid' })
  orderId: string;

  @ApiProperty()
  user: {
    name: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
