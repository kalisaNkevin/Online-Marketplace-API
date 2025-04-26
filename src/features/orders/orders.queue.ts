import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';

@Processor('orders')
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('process-order')
  async handleProcessOrder(job: Job) {
    this.logger.debug(`Processing order ${job.data.orderId}`);
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: job.data.orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Process inventory
      await this.processInventory(order);

      // Update order status
      await this.prisma.order.update({
        where: { id: job.data.orderId },
        data: { status: 'PROCESSING' },
      });

      this.logger.debug(`Order ${job.data.orderId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process order ${job.data.orderId}`, error);
      throw error;
    }
  }

  private async processInventory(order: any) {
    // Process each order item
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.product.id },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
}
