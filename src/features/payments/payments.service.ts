import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaypackProvider } from './providers/paypack.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paypackProvider: PaypackProvider,
  ) {}

  async processPayment(userId: string, createPaymentDto: CreatePaymentDto) {
    const { orderId, phone } = createPaymentDto;

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
  }

  async getTransactions(
    userId: string,
    query: {
      status?: PaymentStatus;
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const { status, page = 1, limit = 10, startDate, endDate } = query;

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
                  title: true,
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
      transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(userId: string, transactionId: string) {
    const transaction = await this.prisma.order.findFirst({
      where: {
        id: transactionId,
        userId,
        paymentStatus: { not: null },
      },
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
                title: true,
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
  }
}
