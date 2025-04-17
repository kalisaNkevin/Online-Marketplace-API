export interface PaymentResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date;
}
