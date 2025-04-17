import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('orders')
export class OrderProcessor {
  constructor(private readonly prisma: PrismaService) {}

  @Process('process-order')
  async handleOrder(job: Job) {
    const { order, userId } = job.data;

    try {
      // Process order logic here
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' },
      });

      // Send notification logic here
      // You can implement email notifications here

      return { success: true, orderId: order.id };
    } catch (error) {
      throw new Error(`Failed to process order: ${error}`);
    }
  }
}
