import { OrderStatus } from '@prisma/client';

export interface CachedOrder {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  orderItems: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
    };
  }[];
}
