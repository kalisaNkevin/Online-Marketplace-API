import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderEntity } from './entities/order.entity';
import { PaymentDto } from './dto/payment.dto';
import { CreateReviewDto } from '../products/dto/create-review.dto';
import { PaginatedOrdersResponse } from './interfaces/paginated-orders-response.interface';

const orderInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
    },
  },
  reviews: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderEntity> {
    const { items, shippingAddress, payment } = createOrderDto;

    // Validate products exist and have sufficient stock
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Calculate order total and validate stock
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (item.quantity > product.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }

      const price = product.discount
        ? product.price.minus(product.discount)
        : product.price;

      const itemTotal = price.mul(new Prisma.Decimal(item.quantity));
      total += itemTotal.toNumber();

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: price,
        total: itemTotal,
        size: item.size,
      });
    }

    // Process payment
    const paymentReference = await this.processPayment(total, payment);

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId, // Changed from shopperId to userId to match Prisma schema
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: payment.method as PaymentMethod, // Add type assertion
          paymentReference,
          total: new Prisma.Decimal(total),
          shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: new Prisma.Decimal(item.price.toString()),
              priceAtPurchase: new Prisma.Decimal(item.price.toString()), // Added this field
              total: new Prisma.Decimal(item.total.toString()),
              size: item.size,
            })),
          },
        },
        include: orderInclude,
      });

      // Update product quantities
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    // Cache order
    // await this.redisService.set(
    //   `order:${order.id}`,
    //   JSON.stringify(order),
    //   3600,
    // );

    return this.transformOrderResponse(order);
  }

  async getShopperOrders(
    userId: string,
    query: QueryOrderDto,
  ): Promise<PaginatedOrdersResponse> {
    const { page = 1, limit = 10, status } = query;

    const where: Prisma.OrderWhereInput = {
      userId, // Changed from shopperId
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(this.transformOrderResponse),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStoreOrders(
    storeId: string,
    query: QueryOrderDto,
  ): Promise<PaginatedOrdersResponse> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    // First verify the store exists
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Then get orders for this store
    const where = {
      items: {
        some: {
          product: {
            storeId: store.id,
          },
        },
      },
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          ...orderInclude,
          items: {
            where: {
              product: {
                storeId: store.id,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  store: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(this.transformOrderResponse),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string): Promise<OrderEntity> {
    // const cachedOrder = await this.redisService.get(`order:${orderId}`);
    // if (cachedOrder) {
    //   return this.transformOrderResponse(JSON.parse(cachedOrder));
    // }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // await this.redisService.set(
    //   `order:${orderId}`,
    //   JSON.stringify(order),
    //   3600,
    // );

    return this.transformOrderResponse(order);
  }

  async shopperCancelOrder(
    orderId: string,
    shopperId: string,
  ): Promise<OrderEntity> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== shopperId) {
      throw new ForbiddenException(
        'Cannot cancel orders that do not belong to you',
      );
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending orders');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Restore product quantities
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // Update order status
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: orderInclude,
      });
    });

    // Update cache
    // await this.redisService.del(`order:${orderId}`);

    return this.transformOrderResponse(updatedOrder);
  }

  private async processPayment(
    total: number,
    payment: PaymentDto,
  ): Promise<string> {
    try {
      let paymentReference: string;

      switch (payment.method) {
        case PaymentMethod.MOMO_MTN:
          paymentReference = await this.processMTNPayment(
            total,
            payment.phoneNumber,
          );
          break;
        case PaymentMethod.MOMO_AIRTEL:
          paymentReference = await this.processAirtelPayment(
            total,
            payment.phoneNumber,
          );
          break;
        case PaymentMethod.CARD:
          paymentReference = await this.processCardPayment(total);
          break;
        case PaymentMethod.CASH:
          paymentReference = 'CASH_ON_DELIVERY';
          break;
        default:
          throw new BadRequestException('Unsupported payment method');
      }

      return paymentReference;
    } catch (error) {
      throw new BadRequestException(`Payment failed: ${error}`);
    }
  }

  private transformOrderResponse(order: any): OrderEntity {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      total: order.total.toString(),
      items:
        order.items?.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name,
          quantity: item.quantity,
          price: item.price.toString(),
          priceAtPurchase: item.priceAtPurchase?.toString(),
          total: item.total.toString(),
          size: item.size,
          store: item.product?.store
            ? {
                id: item.product.store.id,
                name: item.product.store.name,
              }
            : null,
        })) || [],
      shippingAddress: order.shippingAddress || {},
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt || null,
      cancelledAt: order.cancelledAt || null,
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
            phoneNumber: order.user.phoneNumber,
          }
        : null,
      reviews: order.reviews || [],
    };
  }

  async getAllOrders(query: QueryOrderDto): Promise<PaginatedOrdersResponse> {
    const { page = 1, limit = 10, status } = query;
    const where: Prisma.OrderWhereInput = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(this.transformOrderResponse),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStoreOrderById(
    orderId: string,
    storeId: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrderById(orderId);

    const hasStoreItems = order.items.some(
      (item) => item.productId === storeId,
    );

    if (!hasStoreItems) {
      throw new ForbiddenException('Order does not belong to your store');
    }

    return this.transformOrderResponse(order);
  }

  async getShopperOrderById(
    orderId: string,
    userId: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrderById(orderId);

    if (order.user?.id !== userId) {
      throw new ForbiddenException('Order does not belong to you');
    }

    return order;
  }

  async addReview(
    orderId: string,
    userId: string,
    reviewDto: CreateReviewDto,
  ): Promise<any> {
    const order = await this.getOrderById(orderId);

    if (order.user?.id !== userId) {
      throw new ForbiddenException(
        'Cannot review orders that do not belong to you',
      );
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed orders');
    }

    // Check for existing review
    const existingReview = await this.prisma.review.findFirst({
      where: {
        orderId,
        userId,
        productId: reviewDto.productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = await this.prisma.review.create({
      data: {
        rating: reviewDto.rating,
        comment: reviewDto.comment,
        productId: reviewDto.productId,
        orderId,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update product average rating
    await this.updateProductRating(reviewDto.productId);

    return review;
  }

  async adminUpdateOrderStatus(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    const order = await this.getOrderById(orderId);
    const updatedOrder = await this.updateOrderStatus(
      order.id,
      order.user.id,
      updateOrderDto.status,
    );

    // // Send email notification
    // await this.mailService.sendOrderStatusUpdate({
    //   to: order.user.email,
    //   orderNumber: order.id,
    //   status: updateOrderDto.status,
    // });

    return updatedOrder;
  }

  async sellerUpdateOrderStatus(
    orderId: string,
    storeId: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    const order = await this.getOrderById(orderId);

    const hasStoreItems = order.items.some((item) => item.store.id === storeId);

    if (!hasStoreItems) {
      throw new ForbiddenException('Order does not belong to your store');
    }

    const updatedOrder = await this.updateOrderStatus(
      order.id,
      order.user.id,
      updateOrderDto.status,
    );

    // // Send email notification
    // await this.mailService.sendOrderStatusUpdate({
    //   to: order.user.email,
    //   orderNumber: order.id,
    //   status: updateOrderDto.status,
    // });

    return updatedOrder;
  }

  private async updateProductRating(productId: string): Promise<void> {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: { averageRating },
    });
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    status: OrderStatus,
  ): Promise<OrderEntity> {
    const order = await this.getOrderById(orderId);

    // Validate owner
    if (order.user.id !== userId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          comment: `Order status updated from ${order.status} to ${status}`,
        },
      });

      // Update order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === OrderStatus.COMPLETED && { completedAt: new Date() }),
          ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
        },
        include: orderInclude,
      });

      return updated;
    });

    // Invalidate cache
    //await this.redisService.del(`order:${orderId}`);

    // Send email notification
    // await this.emailService.sendOrderStatusUpdate({
    //   to: order.user.email,
    //   orderNumber: orderId,
    //   status,
    //   items: order.items,
    //   total: parseFloat(order.total),
    // });

    return this.transformOrderResponse(updatedOrder);
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  // Payment processing methods to be implemented
  private async processMTNPayment(
    total: number,
    phoneNumber: string,
  ): Promise<string> {
    // Implement MTN Mobile Money integration
    return 'mtn-payment-reference';
  }

  private async processAirtelPayment(
    total: number,
    phoneNumber: string,
  ): Promise<string> {
    // Implement Airtel Money integration
    return 'airtel-payment-reference';
  }

  private async processCardPayment(total: number): Promise<string> {
    // Implement card payment integration
    return 'card-payment-reference';
  }
}
