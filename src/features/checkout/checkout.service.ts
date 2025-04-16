import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createCheckout(userId: string, createCheckoutDto: CreateCheckoutDto) {
    const { cartId, phone } = createCheckoutDto;

    // Get cart with items
    const cart = await this.prisma.cart.findFirst({
      where: {
        id: cartId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart not found or empty');
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Insufficient stock for product: ${item.product.title}`,
        );
      }
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          orderItems: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.product.price,
            })),
          },
        },
      });

      // Update product stock
      await Promise.all(
        cart.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          }),
        ),
      );

      // Clear cart
      await tx.cart.delete({
        where: { id: cartId },
      });

      // Initialize payment
      const payment = await this.paymentsService.processPayment(userId, {
        orderId: order.id,
        phone,
      });

      return {
        orderId: order.id,
        total,
        paymentDetails: payment,
      };
    });
  }
}
