import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { Prisma, Role, Store } from '@prisma/client';
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

  private calculateStoreMetrics(store: any): StoreMetrics {
    const totalProducts = store.products?.length || 0;
    const ratings =
      store.products?.map((p) => p.averageRating).filter(Boolean) || [];
    const averageProductRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      totalProducts,
      averageProductRating,
    };
  }

  async create(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
    // First verify the user exists and is a seller
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== Role.SELLER) {
      throw new ForbiddenException('Only sellers can create stores');
    }

    const { name, description, logoUrl } = createStoreDto;

    return await this.prisma.store.create({
      data: {
        name,
        description,
        ...(logoUrl && { logoUrl }),
        owner: {
          connect: {
            id: user.id, // Use verified user.id
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(
    query: QueryStoreDto,
  ): Promise<PaginatedResponse<StoreResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
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
              id: true, // Include owner ID
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
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.store.count(),
    ]);

    // Transform the data to match StoreResponseDto
    const transformedStores = stores.map((store) => ({
      ...store,
      metrics: this.calculateStoreMetrics(store),
      products: store.products.map((product) => ({
        ...product,
        price: product.price.toNumber(),
        averageRating: product.averageRating?.toNumber(),
      })),
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

  async findByOwnerId(userId: string): Promise<StoreResponseDto[]> {
    const stores = await this.prisma.store.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return stores.map((store) => ({
      ...store,
      metrics: this.calculateStoreMetrics(store),
      products: store.products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price.toNumber(),
        averageRating: product.averageRating?.toNumber(),
      })),
    }));
  }
}
