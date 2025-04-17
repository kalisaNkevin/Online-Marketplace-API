import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma, Product, ProductSize } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import {
  ProductResponseDto,
  PaginatedProductsResponse,
} from './dto/product-response.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createProductDto: CreateProductDto,
    storeId: string,
  ): Promise<ProductResponseDto> {
    try {
      // Verify store and categories exist
      const [store, categories] = await Promise.all([
        this.prisma.store.findUnique({ where: { id: storeId } }),
        this.prisma.category.findMany({
          where: { id: { in: createProductDto.categoryIds } },
        }),
      ]);

      if (!store) {
        throw new NotFoundException(`Store with ID ${storeId} not found`);
      }

      if (categories.length !== createProductDto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }

      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          price: new Prisma.Decimal(createProductDto.price.toString()),
          quantity: createProductDto.quantity,
          isFeatured: createProductDto.isFeatured ?? false,
          store: { connect: { id: storeId } },
          categories: {
            connect: createProductDto.categoryIds.map((id) => ({ id })),
          },
          variants: {
            create: createProductDto.variants.map((variant) => ({
              size: variant,
              quantity: 0,
            })),
          },
          averageRating: new Prisma.Decimal(0),
        },
        include: {
          store: {
            select: { id: true, name: true },
          },
          categories: {
            select: { id: true, name: true },
          },
          variants: {
            select: {
              size: true,
            },
          },
          _count: {
            select: {
              Review: true,
              OrderItem: true,
              categories: true,
            },
          },
        },
      });

      return {
        ...product,
        categoryIds: product.categories.map((c) => c.id),
        metrics: {
          totalReviews: product._count.Review,
          totalOrders: product._count.OrderItem,
          averageRating: product.averageRating,
        },
        variants: product.variants.map((variant) => variant.size),
      };
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw new BadRequestException('Invalid product data: ' + error.message);
      }
      throw error;
    }
  }

  async findAll(query: QueryProductDto): Promise<{
    data: ProductResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortOrder = 'desc',
    } = query;

    const where: Prisma.ProductWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        categoryId
          ? {
              categories: {
                some: { id: categoryId },
              },
            }
          : {},
        minPrice ? { price: { gte: new Prisma.Decimal(minPrice) } } : {},
        maxPrice ? { price: { lte: new Prisma.Decimal(maxPrice) } } : {},
      
      ],
    };



    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => variant.size),
        categoryIds: product.categories.map((c) => c.id),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      ...product,
      categoryIds: product.categories.map((c) => c.id),
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    storeId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.findOne(id);

    if (product.storeId !== storeId) {
      throw new ForbiddenException(
        'You can only update products from your store',
      );
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        price: updateProductDto.price
          ? new Prisma.Decimal(updateProductDto.price.toString())
          : undefined,
        variants: updateProductDto.variants
          ? {
              deleteMany: {},
              create: updateProductDto.variants.map((variant) => ({
                size: variant,
                quantity: 0,
              })),
            }
          : undefined,
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
        _count: {
          select: {
            Review: true,
            OrderItem: true,
          },
        },
      },
    });

    return {
      ...updatedProduct,
      store: updatedProduct.store,
      categories: updatedProduct.categories,
      categoryIds: updatedProduct.categories.map((category) => category.id),
      variants: updatedProduct.variants.map((variant) => variant.size),
      metrics: {
        totalReviews: updatedProduct._count.Review,
        totalOrders: updatedProduct._count.OrderItem,
        averageRating: updatedProduct.averageRating,
      },
    };
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
