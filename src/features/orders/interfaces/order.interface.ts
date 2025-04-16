import { OrderStatus } from '@prisma/client';

export interface CachedOrder {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  orderItems: {
    id: string;
    quantity: number;
    product: {
      id: string;
      title: string;
      price: number;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}