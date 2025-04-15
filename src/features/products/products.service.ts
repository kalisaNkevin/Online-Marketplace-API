import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, storeId: string) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        storeId,
        price: new Prisma.Decimal(createProductDto.price),
      },
    });
  }

  async findAll(query: QueryProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      inStock,
    } = query;

    const where: Prisma.ProductWhereInput = {
      AND: [
        // Search by title or description
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        // Filter by category
        categoryId ? { categoryId } : {},
        // Filter by price range
        minPrice ? { price: { gte: new Prisma.Decimal(minPrice) } } : {},
        maxPrice ? { price: { lte: new Prisma.Decimal(maxPrice) } } : {},
        // Filter by rating
        minRating
          ? { averageRating: { gte: new Prisma.Decimal(minRating) } }
          : {},
        // Filter by stock status
        inStock !== undefined ? { inStock } : {},
      ],
    };

    // Dynamic sort order
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              AND: [
                {
                  user: {
                    orders: {
                      some: {
                        orderItems: {
                          some: {
                            product: {
                              id: {
                                equals: undefined, // Ensure product ID is not null
                                
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                { rating: { gt: 0 } }, // Ensure rating exists
              ],
            },
            take: 5, // Limit to latest 5 reviews
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Calculate additional metrics
    const enhancedProducts = products.map((product) => ({
      ...product,
      metrics: {
        totalReviews: product._count.reviews,
        totalOrders: product._count.orderItems,
        averageRating: product.averageRating,
      },
      // Remove _count from final response
      _count: undefined,
    }));

    return {
      data: enhancedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        appliedCategory: categoryId ? products[0]?.categoryId : null,
        priceRange: {
          min: minPrice || null,
          max: maxPrice || null,
        },
        ratingFilter: minRating || null,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    storeId: string,
  ) {
    const product = await this.findOne(id);

    if (product.storeId !== storeId) {
      throw new ForbiddenException(
        'You can only update products from your store',
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        price: updateProductDto.price
          ? new Prisma.Decimal(updateProductDto.price)
          : undefined,
      },
    });
  }

  async remove(id: string, storeId: string) {
    const product = await this.findOne(id);

    if (product.storeId !== storeId) {
      throw new ForbiddenException(
        'You can only delete products from your store',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message: 'Product deleted successfully',
    };
  }
}
