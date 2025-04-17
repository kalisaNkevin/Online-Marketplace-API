import { Order } from '@prisma/client';

export interface TransactionResponse {
  data: Partial<Order>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
