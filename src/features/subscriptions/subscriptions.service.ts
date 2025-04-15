import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async subscribe(dto: CreateSubscriptionDto) {
    try {
      const subscription = await this.prisma.Subscription.create({
        data: {
          email: dto.email,
        },
      });

      return {
        message: 'Successfully subscribed to newsletter',
        email: subscription.email,
      };
    } catch (error) {
        if ((error as any).code === 'P2002') {
            throw new ConflictException('Email already subscribed');
        }
      throw error;
    }
  }

  async unsubscribe(email: string) {
    const subscription = await this.prisma.Subscription.update({
      where: { email },
      data: { isActive: false },
    });

    return {
      message: 'Successfully unsubscribed from newsletter',
      email: subscription.email,
    };
  }

  async findAll() {
    const subscriptions = await this.prisma.Subscription.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Subscriptions retrieved successfully',
      data: subscriptions,
    };
  }

  async findOne(id: string) {
    const subscription = await this.prisma.Subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      message: 'Subscription retrieved successfully',
      data: subscription,
    };
  }

  async remove(id: string) {
    try {
      await this.prisma.Subscription.delete({
        where: { id },
      });

      return {
        message: 'Subscription deleted successfully',
      };
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundException('Subscription not found');
      }
      throw error;
    }
  }
}
