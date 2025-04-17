import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaypackProvider } from './providers/paypack.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, Prisma, Order } from '@prisma/client';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionResponse } from './interfaces/transaction-response.interface';
import { PaymentResponse } from './interfaces/payment-response.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paypackProvider: PaypackProvider,
  ) {}

  async processPayment(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    const { orderId, phone } = createPaymentDto;

    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          paymentStatus: null,
        },
      });

      if (!order) {
        throw new BadRequestException('Order not found or already paid');
      }

      const payment = await this.paypackProvider.createPayment({
        amount: Number(order.total),
        phone,
        orderId,
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentReference: payment.transactionId,
          paymentStatus: PaymentStatus.PENDING,
          paymentProvider: 'PAYPACK',
        },
      });

      return payment;
    } catch (error) {
      this.logger.error(
        `Failed to process payment for order ${orderId}: ${error}`,
        error,
      );
      throw new BadRequestException('Payment processing failed');
    }
  }

  async getTransactions(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<TransactionResponse> {
    const { status, page = 1, limit = 10, startDate, endDate } = query;

    try {
      const where: Prisma.OrderWhereInput = {
        userId,
        paymentStatus: { not: null },
        ...(status && { paymentStatus: status }),
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
      };

      const [transactions, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          select: {
            id: true,
            total: true,
            paymentStatus: true,
            paymentReference: true,
            paymentProvider: true,
            createdAt: true,
            updatedAt: true,
            orderItems: {
              select: {
                quantity: true,
                product: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        data: transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch transactions: ${error}`, error);
      throw new BadRequestException('Failed to fetch transactions');
    }
  }

  async getTransactionById(
    userId: string,
    transactionId: string,
  ): Promise<Order> {
    try {
      const transaction = await this.prisma.order.findFirst({
        where: {
          id: transactionId,
          userId,
          paymentStatus: { not: null },
        },
        select: {
          id: true,
          userId: true,
          status: true,
          total: true,
          paymentStatus: true,
          paymentReference: true,
          paymentProvider: true,
          createdAt: true,
          updatedAt: true,
          orderItems: {
            select: {
              quantity: true,
              product: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transaction ${transactionId}: ${error}`,
        error,
      );
      throw error;
    }
  }
}
