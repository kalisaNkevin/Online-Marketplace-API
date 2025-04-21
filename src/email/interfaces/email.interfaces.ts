import { OrderStatus, PaymentMethod } from '@prisma/client';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OrderStatusUpdateParams {
  to: string;
  orderNumber: string;
  status: OrderStatus;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export interface PaymentConfirmationParams {
  to: string;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface OrderDetails {
  orderNumber: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}