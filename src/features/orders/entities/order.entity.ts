import { ApiProperty } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductSize,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class OrderItemEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  size: ProductSize;

  @ApiProperty()
  price: Decimal;

  @ApiProperty()
  priceAtPurchase: Decimal;

  @ApiProperty()
  total: Decimal;

  @ApiProperty({ required: false, type: Object, nullable: true })
  product?: {
    id: string;
    name: string;
    store?: {
      id: string;
      name: string;
    };
  };
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

  @ApiProperty({ required: false, nullable: true })
  statusMessage?: string;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, nullable: true })
  paymentReference?: string;

  @ApiProperty()
  total: Decimal;

  @ApiProperty({ type: [OrderItemEntity] })
  orderItems: OrderItemEntity[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  shippingAddress: any; 

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  completedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  cancelledAt?: Date | null;

  @ApiProperty({ required: false, type: Object, nullable: true })
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };

  @ApiProperty({ required: false, type: Array, nullable: true })
  reviews?: any[];
}
