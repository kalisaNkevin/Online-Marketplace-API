import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createStoreDto: CreateStoreDto) {
    return await this.prisma.store.create({
      data: {
        ...createStoreDto,
        userId
      }
    });
  }

  async findAll(query: QueryStoreDto) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const where: Prisma.StoreWhereInput = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
      ]
    };

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          products: {
            select: {
              id: true,
              title: true,
              price: true,
              averageRating: true
            },
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      this.prisma.store.count({ where })
    ]);

    const enhancedStores = stores.map(store => ({
      ...store,
      metrics: {
        totalProducts: store._count.products,
        averageProductRating: store.products.reduce((acc, product) => 
          acc + (product.averageRating?.toNumber() || 0), 0) / store.products.length || 0
      },
      _count: undefined
    }));

    return {
      data: enhancedStores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        products: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async update(id: string, userId: string, updateStoreDto: UpdateStoreDto) {
    const store = await this.findOne(id);

    if (store.userId !== userId) {
      throw new ForbiddenException('You can only update your own store');
    }

    return this.prisma.store.update({
      where: { id },
      data: updateStoreDto
    });
  }

  async remove(id: string, userId: string) {
    const store = await this.findOne(id);

    if (store.userId !== userId) {
      throw new ForbiddenException('You can only delete your own store');
    }

    await this.prisma.store.delete({ where: { id } });
    return { message: 'Store deleted successfully' };
  }

  async findByUser(userId: string, query: QueryStoreDto) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const where: Prisma.StoreWhereInput = {
      AND: [
        { userId },
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
      ]
    };

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          products: {
            select: {
              id: true,
              title: true,
              price: true,
              averageRating: true
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      this.prisma.store.count({ where })
    ]);

    return {
      data: stores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}