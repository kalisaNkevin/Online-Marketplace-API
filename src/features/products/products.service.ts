import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Prisma } from '@prisma/client';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private readonly productInclude = {
    store: {
      select: {
        id: true,
        name: true,
      },
    },
    categories: true,
    variants: true,
    Review: {
      // Changed from 'reviews' to 'Review'
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
    sellerId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { categories, variants, ...data } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...data,
        store: { connect: { id: sellerId } },
        categories: {
          connect: categories?.map((id) => ({ id })),
        },
        variants: {
          createMany: {
            data: variants || [],
          },
        },
      },
      include: {
        store: true,
        categories: true,
        variants: true,
      },
    });

    await this.redisService.del('featured_products');
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
        },
        orderBy: { [sortOrder]: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map(this.transformProductResponse),
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
    const cachedProducts = await this.redisService.get('featured_products');
    if (cachedProducts) {
      return JSON.parse(cachedProducts);
    }

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
    await this.redisService.set(
      'featured_products',
      JSON.stringify(transformed),
      3600,
    );

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
    sellerId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, store: { ownerId: sellerId } },
    });

    if (!product) {
      throw new NotFoundException('Product not found or unauthorized');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        categories: updateProductDto.categories
          ? {
              set: updateProductDto.categories.map((id) => ({ id })),
            }
          : undefined,
        variants: updateProductDto.variants
          ? {
              upsert: updateProductDto.variants.map((variant) => ({
                where: {
                  productId_size: { productId: id, size: variant.size },
                },
                update: {
                  size: variant.size,
                  quantity: variant.quantity,
                },
                create: {
                  size: variant.size,
                  quantity: variant.quantity,
                },
              })),
            }
          : undefined,
      },
      include: {
        store: true,
        categories: true,
        variants: true,
      },
    });

    if (updated.isFeatured) {
      await this.redisService.del('featured_products');
    }

    return this.transformProductResponse(updated);
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
    if (product.isFeatured) {
      await this.redisService.del('featured_products');
    }

    return { message: 'Product deleted successfully' };
  }

  async getFeaturedProducts(): Promise<ProductResponseDto[]> {
    const cachedProducts = await this.redisService.get('featured_products');
    if (cachedProducts) {
      return JSON.parse(cachedProducts);
    }

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

    await this.redisService.set(
      'featured_products',
      JSON.stringify(transformedProducts),
      3600,
    );

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

    await this.redisService.del('featured_products');
    return this.transformProductResponse(updatedProduct);
  }
}
