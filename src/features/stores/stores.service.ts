import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { Prisma, Store } from '@prisma/client';
import { StoreResponseDto } from './dto/store-response.dto';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StoreMetrics {
  totalProducts: number;
  averageProductRating: number;
}

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  private buildWhereClause(
    search?: string,
    userId?: string,
  ): Prisma.StoreWhereInput {
    return {
      AND: [
        userId ? { ownerId: userId } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };
  }

  private calculateStoreMetrics(store: any): StoreMetrics {
    return {
      totalProducts: store._count.products,
      averageProductRating:
        store.products.reduce(
          (acc: number, product: any) =>
            acc + (product.averageRating?.toNumber() || 0),
          0,
        ) / store.products.length || 0,
    };
  }

  private async validateStoreOwnership(
    storeId: string,
    userId: string,
  ): Promise<Store> {
    const store = await this.findOne(storeId);

    if (store.ownerId !== userId) {
      throw new ForbiddenException('You can only manage your own store');
    }

    return store;
  }

  async create(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
    return await this.prisma.store.create({
      data: {
        ...createStoreDto,
        ownerId: userId,
      },
    });
  }

  async findAll(query: QueryStoreDto): Promise<{
    data: StoreResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = query;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              averageRating: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.store.count(),
    ]);

    // Transform the data to match StoreResponseDto
    const transformedStores = stores.map((store) => ({
      ...store,
      metrics: {
        totalProducts: store._count.products,
        averageProductRating:
          store.products.reduce(
            (acc, product) => acc + (product.averageRating?.toNumber() || 0),
            0,
          ) / store.products.length || 0,
      },
    }));

    return {
      data: transformedStores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        products: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async update(
    id: string,
    userId: string,
    updateStoreDto: UpdateStoreDto,
  ): Promise<Store> {
    await this.validateStoreOwnership(id, userId);

    return this.prisma.store.update({
      where: { id },
      data: updateStoreDto,
    });
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.validateStoreOwnership(id, userId);

    await this.prisma.store.delete({ where: { id } });
    return { message: 'Store deleted successfully' };
  }

  async findByUser(
    userId: string,
    query: QueryStoreDto,
  ): Promise<PaginatedResponse<Store>> {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where = this.buildWhereClause(search, userId);
    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: stores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
