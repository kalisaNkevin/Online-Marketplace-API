import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CachedOrder } from './interfaces/order.interface';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;

    // Check if all products exist and have enough stock
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map(item => item.productId) } }
    });

    if (products.length !== items.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Calculate total and validate stock
    let total = 0;
    products.forEach(product => {
      const orderItem = items.find(item => item.productId === product.id);
      if (product.stock < orderItem.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.title}`);
      }
      total += Number(product.price) * orderItem.quantity;
    });

    const order = await this.prisma.$transaction(async (tx) => {
      // Create order and order items
      const order = await tx.order.create({
        data: {
          userId,
          total,
          orderItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: products.find(p => p.id === item.productId).price
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      // Update product stock
      await Promise.all(
        items.map(async item =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              inStock: {
                set: (await tx.product.findUnique({
                  where: { id: item.productId }
                })).stock - item.quantity > 0
              }
            }
          })
        )
      );

      return order;
    });

    // Add to Redis queue for processing
    await this.redisService.addOrderToQueue({ order, userId });
    
    // Cache order details
    const cachedOrder: CachedOrder = {
      id: order.id,
      userId: order.userId,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          title: item.product.title,
          price: Number(item.product.price),
        },
      })),
    };

    await this.redisService.cacheOrderDetails(order.id, cachedOrder);

    return order;
  }

  async getOrders(userId: string, query: QueryOrderDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { userId, ...(status && { status }) };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  title: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
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
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Cache the result
    await this.redisService.cacheOrderDetails(orderId, order as unknown as CachedOrder);

    return order;
  }

  async updateOrderStatus(orderId: string, userId: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.getOrderById(orderId, userId);

    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled orders');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: updateOrderDto.status },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      // Restore product stock
      await Promise.all(
        order.orderItems.map(item =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              inStock: true
            }
          })
        )
      );

      // Update order status
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
    });
  }
}
