import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CachedOrder } from './interfaces/order.interface';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private async validateProducts(items: CreateOrderDto['items']) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } },
    });

    if (products.length !== items.length) {
      throw new BadRequestException('One or more products not found');
    }

    let total = 0;
    products.forEach((product) => {
      const orderItem = items.find((item) => item.productId === product.id);
      if (!orderItem) return;

      if (product.quantity < orderItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }
      total += Number(product.price) * orderItem.quantity;
    });

    return { products, total };
  }

  private async updateProductStock(
    tx: Prisma.TransactionClient,
    items: CreateOrderDto['items'],
    increment = false,
  ) {
    return Promise.all(
      items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              [increment ? 'increment' : 'decrement']: item.quantity,
            },
          },
        }),
      ),
    );
  }

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<CachedOrder> {
    const { items } = createOrderDto;
    const { products, total } = await this.validateProducts(items);

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId,
            total: new Prisma.Decimal(total),
            orderItems: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: products.find((p) => p.id === item.productId)
                  ?.price,
              })),
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });

        await this.updateProductStock(tx, items);
        return order;
      });

      const cachedOrder: CachedOrder = {
        id: order.id,
        userId: order.userId,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        orderItems: order.orderItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.priceAtPurchase),
          },
        })),
      };

      await Promise.all([
        this.redisService.addOrderToQueue({ order, userId }),
        this.redisService.cacheOrderDetails(order.id, cachedOrder),
      ]);

      return cachedOrder;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error}`, error);
      throw new BadRequestException('Failed to create order');
    }
  }

  async getOrders(userId: string, query: QueryOrderDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    try {
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { userId, ...(status && { status }) },
          skip,
          take: limit,
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({
          where: { userId, ...(status && { status }) },
        }),
      ]);

      return {
        data: orders,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get orders: ${error}`, error);
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  async getOrderById(orderId: string, userId: string) {
    // Try to get from cache first
    const cachedOrder = await this.redisService.getCachedOrderDetails(orderId);
    if (cachedOrder && cachedOrder.userId === userId) {
      return cachedOrder as CachedOrder;
    }

    // If not in cache, get from database
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Cache the result
    await this.redisService.cacheOrderDetails(
      orderId,
      order as unknown as CachedOrder,
    );

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    updateOrderDto: UpdateOrderDto,
  ) {
    const order = await this.getOrderById(orderId, userId);

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot update completed or cancelled orders',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: updateOrderDto.status },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async cancelOrder(orderId: string, userId: string): Promise<CachedOrder> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    try {
      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
        await this.updateProductStock(
          tx,
          order.orderItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          true,
        );

        return tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });
      });

      await this.redisService.cacheOrderDetails(
        orderId,
        cancelledOrder as unknown as CachedOrder,
      );

      return cancelledOrder as unknown as CachedOrder;
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${error}`, error);
      throw new BadRequestException('Failed to cancel order');
    }
  }
}
