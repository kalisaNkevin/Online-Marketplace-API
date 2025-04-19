import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { OrderStatus, Review, Prisma } from '@prisma/client';

interface ReviewWithUser extends Review {
  user: { name: string };
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateAverageRating(reviews: Review[]): number | null {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  private async validateOrderAndProduct(
    userId: string,
    productId: string,
    orderId: string,
  ): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: OrderStatus.COMPLETED,
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException(
        'You can only review products from your completed orders',
      );
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        AND: [{ userId }, { productId }, { orderId }],
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }
  }

  private async updateProductRating(
    tx: Prisma.TransactionClient,
    productId: string,
  ): Promise<number | null> {
    const reviews = await tx.review.findMany({ where: { productId } });
    const averageRating = this.calculateAverageRating(reviews);

    await tx.product.update({
      where: { id: productId },
      data: { averageRating },
    });

    return averageRating;
  }

  async create(
    userId: string,
    productId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewWithUser> {
    const { orderId, rating, comment } = createReviewDto;

    await this.validateOrderAndProduct(userId, productId, orderId);

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          rating,
          comment,
          user: { connect: { id: userId } },
          product: { connect: { id: productId } },
          order: { connect: { id: orderId } },
        },
        include: {
          user: { select: { name: true } },
        },
      });

      await this.updateProductRating(tx, productId);

      return review;
    });
  }

  async update(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewWithUser> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found or not owned by user');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: updateReviewDto,
        include: {
          user: { select: { name: true } },
          product: { select: { name: true } },
        },
      });

      await this.updateProductRating(tx, review.productId);

      return updated;
    });
  }

  async delete(userId: string, reviewId: string): Promise<{ message: string }> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found or not owned by user');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await this.updateProductRating(tx, review.productId);
      return { message: 'Review deleted successfully' };
    });
  }

  async findProductReviews(productId: string): Promise<ReviewWithUser[]> {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
