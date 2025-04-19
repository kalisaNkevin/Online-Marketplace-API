import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';

import { OrderStatus, PaymentStatus } from '@prisma/client';
import { RedisService } from '../redis.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
@Processor('orders')
export class OrderProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  @Process('process-order')
  async handleOrder(job: Job): Promise<any> {
    const { order, userId } = job.data;

    try {
      // Update order status
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Invalidate cache
      await this.redisService.del(`order:${order.id}`);

      // Send email notification
      await this.mailService.sendOrderStatusUpdate({
        to: updatedOrder.user.email,
        orderNumber: updatedOrder.id,
        status: OrderStatus.PROCESSING,
        items: updatedOrder.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price.toNumber(),
        })),
        total: updatedOrder.total.toNumber(),
      });

      // Process payment if needed
      if (updatedOrder.paymentStatus === PaymentStatus.PENDING) {
        await this.queuePaymentProcessing(updatedOrder);
      }

      return {
        success: true,
        orderId: order.id,
        status: OrderStatus.PROCESSING,
      };
    } catch (error) {
      // Log error and notify admin
      console.error(`Failed to process order ${order.id}:`, error);

      // Update order status to failed
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          statusMessage: `Processing failed: ${this.getErrorMessage(error)}`,
        },
      });

      throw new Error(
        `Failed to process order: ${this.getErrorMessage(error)}`,
      );
    }
  }

  @Process('process-payment')
  async processPayment(job: Job): Promise<any> {
    const { order } = job.data;

    try {
      // Update payment status
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.COMPLETED },
        include: { user: true },
      });

      // Send payment confirmation email
      await this.mailService.sendPaymentConfirmation({
        to: updatedOrder.user.email,
        orderNumber: updatedOrder.id,
        amount: updatedOrder.total.toNumber(),
        paymentMethod: updatedOrder.paymentMethod,
      });

      return {
        success: true,
        orderId: order.id,
        status: PaymentStatus.COMPLETED,
      };
    } catch (error) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.CANCELLED,
          statusMessage: `Payment failed: ${this.getErrorMessage(error)}`,
        },
      });

      throw new Error(
        `Payment processing failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async queuePaymentProcessing(order: any): Promise<void> {
    await this.redisService.addOrderToQueue(
      order,
      order.userId,
      'process-payment',
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
