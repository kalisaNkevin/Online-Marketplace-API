import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export class OrderItemEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: string;

  @ApiProperty()
  priceAtPurchase: string;

  @ApiProperty()
  total: string;

  @ApiProperty({ required: false })
  size?: string;

  @ApiProperty({ required: false, type: Object, nullable: true })
  store?: {
    id: string;
    name: string;
  } | null;
}

export class OrderUserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;
}

export class OrderEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty()
  paymentReference: string;

  @ApiProperty()
  total: string;

  @ApiProperty({ type: [OrderItemEntity] })
  items: OrderItemEntity[];

  @ApiProperty({ 
    type: 'object', 
    additionalProperties: true 
  })
  shippingAddress: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  completedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  cancelledAt?: Date | null;

  @ApiProperty({ type: () => OrderUserEntity, nullable: true })
  user: OrderUserEntity | null;

  @ApiProperty({ type: [Object] })
  reviews: any[];
}
