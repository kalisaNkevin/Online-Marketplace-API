import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductSize,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  size: ProductSize;
  price: Decimal;
  priceAtPurchase: Decimal;
  total: Decimal;
  product?: {
    id: string;
    name: string;
    store?: {
      id: string;
      name: string;
    };
  };
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  statusMessage?: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  total: Decimal;
  items: OrderItem[];
  shippingAddress: any; // Replace with proper type
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  reviews?: any[];
}
