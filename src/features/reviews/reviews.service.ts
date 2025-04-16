import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { OrderStatus } from '@prisma/client';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    productId: string,
    createReviewDto: CreateReviewDto,
  ) {
    const { orderId, rating, comment } = createReviewDto;

    // Verify order exists and belongs to user
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: OrderStatus.COMPLETED,
        orderItems: {
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

    // Check if review already exists
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
        orderId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create review with nested connects
      const review = await tx.review.create({
        data: {
          rating,
          comment,
          user: { connect: { id: userId } },
          product: { connect: { id: productId } },
          order: { connect: { id: orderId } },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              title: true,
            },
          },
        },
      });

      // Update product average rating
      const reviews = await tx.review.findMany({
        where: { productId },
      });

      const averageRating = Number(
        (
          reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        ).toFixed(1),
      );

      await tx.product.update({
        where: { id: productId },
        data: { averageRating },
      });

      return review;
    });
  }

  async update(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new BadRequestException('Review not found or not owned by user');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: updateReviewDto.rating,
          comment: updateReviewDto.comment,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              title: true,
            },
          },
        },
      });

      // Recalculate average rating
      const reviews = await tx.review.findMany({
        where: { productId: review.productId },
      });

      const averageRating = Number(
        (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1),
      );

      await tx.product.update({
        where: { id: review.productId },
        data: { averageRating },
      });

      return updated;
    });
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new BadRequestException('Review not found or not owned by user');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      });

      // Recalculate average rating
      const reviews = await tx.review.findMany({
        where: { productId: review.productId },
      });

      const averageRating = reviews.length
        ? Number(
            (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1),
          )
        : null;

      await tx.product.update({
        where: { id: review.productId },
        data: { averageRating },
      });

      return { message: 'Review deleted successfully' };
    });
  }

  async findProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }
}
