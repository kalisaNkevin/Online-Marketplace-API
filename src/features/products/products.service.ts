import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { OrderStatus, Prisma, Review } from '@prisma/client';
import { ProductEntity } from './entities/product.entity';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productInclude = {
    store: {
      select: {
        id: true,
        name: true,
      },
    },
    categories: {
      select: {
        id: true,
        name: true,
      },
    },
    variants: true,
    Review: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  } as const;

  private transformProductResponse(product: any): ProductResponseDto {
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const averageRating = product.reviews?.length
      ? Number(
          (
            product.reviews.reduce((acc, r) => acc + r.rating, 0) /
            product.reviews.length
          ).toFixed(1),
        )
      : null;

    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(), // Convert Decimal to string
      quantity: product.quantity,
      discount: product.discount || null, // Keep as Decimal
      thumbnail: product.thumbnail || null,
      images: product.images || [],
      isFeatured: product.isFeatured || false,
      isActive: product.isActive || false,
      storeId: product.storeId,
      store: product.store
        ? {
            id: product.store.id,
            name: product.store.name,
          }
        : null,
      categories:
        product.categories?.map((cat) => ({
          id: cat.id,
          name: cat.name,
        })) || [],
      variants:
        product.variants?.map((variant) => ({
          size: variant.size,
          quantity: variant.quantity,
        })) || [],
      reviews:
        product.reviews?.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          user: {
            id: review.user.id,
            name: review.user.name,
          },
        })) || [],
      averageRating,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async create(
    storeId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { categories, variants, ...productData } = createProductDto;

    // Create product with proper relations
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        store: {
          connect: { id: storeId },
        },
        categories: {
          connect: categories?.map((id) => ({ id })) || [],
        },
        variants: {
          create:
            variants?.map((variant) => ({
              size: variant.size,
              quantity: variant.quantity,
            })) || [],
        },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: true,
        Review: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.transformProductResponse(product);
  }

  async findAll(query: QueryProductDto): Promise<{
    data: ProductResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    filters: {
      appliedCategory: string | null;
      priceRange: { min: number | null; max: number | null };
      ratingFilter: number | null;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId: category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && {
        categories: { some: { id: category } },
      }),
      ...(minPrice && { price: { gte: new Prisma.Decimal(minPrice) } }),
      ...(maxPrice && { price: { lte: new Prisma.Decimal(maxPrice) } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          store: true,
          categories: true,
          variants: true,
          Review: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder, // This is the correct way to specify ordering
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => this.transformProductResponse(product)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        appliedCategory: category || null,
        priceRange: {
          min: minPrice || null,
          max: maxPrice || null,
        },
        ratingFilter: null,
      },
    };
  }

  async findFeatured(): Promise<ProductResponseDto[]> {
    // const cachedProducts = await this.redisService.get('featured_products');
    // if (cachedProducts) {
    //   return JSON.parse(cachedProducts);
    // }

    const products = await this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: {
        store: true,
        categories: true,
        variants: true,
      },
      take: 10,
    });

    const transformed = products.map(this.transformProductResponse);
    // await this.redisService.set(
    //   'featured_products',
    //   JSON.stringify(transformed),
    //   3600,
    // );

    return transformed;
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        categories: true,
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.transformProductResponse(product);
  }

  async update(
    id: string,
    storeId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    // First verify the product exists and belongs to the store
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        storeId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(
        'Product not found or does not belong to your store',
      );
    }

    const { categories, variants, ...productData } = updateProductDto;

    // Use unchecked update for better type safety
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        categories: categories
          ? {
              set: categories.map((id) => ({ id })),
            }
          : undefined,
        variants: variants
          ? {
              deleteMany: {}, // First delete existing variants
              createMany: {
                // Then create new ones
                data: variants.map((variant) => ({
                  size: variant.size,
                  quantity: variant.quantity,
                })),
              },
            }
          : undefined,
      },
      include: this.productInclude,
    });

    return this.transformProductResponse(updatedProduct);
  }

  async remove(id: string, storeId: string): Promise<{ message: string }> {
    // Check if product exists and belongs to the store
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        storeId,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Product not found or you are not authorized to delete it',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      // Delete the product
      await tx.product.delete({
        where: { id },
      });
    });

    // Clear cache if it was a featured product
    // if (product.isFeatured) {
    //   await this.redisService.del('featured_products');
    // }

    return { message: 'Product deleted successfully' };
  }

  async getFeaturedProducts(): Promise<ProductResponseDto[]> {
    // const cachedProducts = await this.redisService.get('featured_products');
    // if (cachedProducts) {
    //   return JSON.parse(cachedProducts);
    // }

    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        variants: true,
        Review: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    });

    const transformedProducts = products.map(this.transformProductResponse);

    // await this.redisService.set(
    //   'featured_products',
    //   JSON.stringify(transformedProducts),
    //   3600,
    // );

    return transformedProducts;
  }

  async toggleFeaturedStatus(
    id: string,
    adminId: string,
    isFeatured: boolean,
  ): Promise<ProductEntity> {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        categories: true,
        variants: true,
        Review: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Update featured status
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { isFeatured },
      include: {
        store: true,
        categories: true,
        variants: true,
        Review: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // await this.redisService.del('featured_products');
    return this.transformProductResponse(updatedProduct);
  }
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

  async updateReview(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<any> {
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

  async findProductReviews(productId: string): Promise<any[]> {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
