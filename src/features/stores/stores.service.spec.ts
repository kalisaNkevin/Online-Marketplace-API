import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('StoresService', () => {
  let service: StoresService;
  let prismaService: PrismaService;

  const mockStore = {
    id: '1',
    name: 'Test Store',
    description: 'Test Description',
    ownerId: '1',
    owner: {
      name: 'Test Owner',
      email: 'owner@test.com',
    },
    products: [
      {
        id: '1',
        name: 'Test Product',
        price: new Decimal('100.00'),
        averageRating: new Decimal('4.5'),
      },
    ],
    _count: {
      products: 1,
    },
    metrics: {
      totalProducts: 1,
      averageProductRating: 4.5,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    store: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('buildWhereClause', () => {
    it('should build where clause with search term', () => {
      const result = (service as any).buildWhereClause('test');
      expect(result).toEqual({
        AND: [
          {},
          {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        ],
      });
    });

    it('should build where clause with userId', () => {
      const result = (service as any).buildWhereClause(undefined, '1');
      expect(result).toEqual({
        AND: [{ ownerId: '1' }, {}],
      });
    });
  });

  describe('calculateStoreMetrics', () => {
    it('should calculate metrics correctly', () => {
      const store = {
        _count: { products: 2 },
        products: [
          { averageRating: new Decimal('4.5') },
          { averageRating: new Decimal('3.5') },
        ],
      };

      const result = (service as any).calculateStoreMetrics(store);
      expect(result).toEqual({
        totalProducts: 2,
        averageProductRating: 4,
      });
    });

    it('should handle store with no products', () => {
      const store = {
        _count: { products: 0 },
        products: [],
      };

      const result = (service as any).calculateStoreMetrics(store);
      expect(result).toEqual({
        totalProducts: 0,
        averageProductRating: 0,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated stores with search', async () => {
      const query: QueryStoreDto = {
        search: 'test',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockPrismaService.store.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockPrismaService.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
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
              select: {
                products: true,
              },
            },
          },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should handle empty search results', async () => {
      mockPrismaService.store.findMany.mockResolvedValue([]);
      mockPrismaService.store.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByUser', () => {
    const userId = '1';

    it('should return user stores with pagination', async () => {
      const query: QueryStoreDto = {
        page: 1,
        limit: 10,
      };

      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockPrismaService.store.count.mockResolvedValue(1);

      const result = await service.findByUser(userId, query);

      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ ownerId: userId }]),
          }),
        }),
      );
    });

    it('should return empty array when user has no stores', async () => {
      mockPrismaService.store.findMany.mockResolvedValue([]);
      mockPrismaService.store.count.mockResolvedValue(0);

      const result = await service.findByUser(userId, {});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('validateStoreOwnership', () => {
    it('should throw ForbiddenException when user is not store owner', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue({
        ...mockStore,
        ownerId: '2',
      });

      await expect(
        (service as any).validateStoreOwnership('1', '1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return store when user is owner', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(mockStore);

      const result = await (service as any).validateStoreOwnership('1', '1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('create', () => {
    it('should create a store', async () => {
      const createStoreDto: CreateStoreDto = {
        name: 'Test Store',
        description: 'Test Description',
      };

      mockPrismaService.store.create.mockResolvedValue(mockStore);

      const result = await service.create('1', createStoreDto);

      expect(result).toEqual(mockStore);
      expect(mockPrismaService.store.create).toHaveBeenCalledWith({
        data: {
          ...createStoreDto,
          ownerId: '1',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a store', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(mockStore);

      const result = await service.findOne('1');

      expect(result).toEqual(mockStore);
      expect(mockPrismaService.store.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateStoreDto: UpdateStoreDto = {
      name: 'Updated Store',
    };

    it('should update a store', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(mockStore);
      mockPrismaService.store.update.mockResolvedValue({
        ...mockStore,
        ...updateStoreDto,
      });

      const result = await service.update('1', '1', updateStoreDto);

      expect(result.name).toBe(updateStoreDto.name);
      expect(mockPrismaService.store.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateStoreDto,
      });
    });

    it('should throw ForbiddenException if user is not store owner', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue({
        ...mockStore,
        ownerId: '2',
      });

      await expect(service.update('1', '1', updateStoreDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a store', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(mockStore);
      mockPrismaService.store.delete.mockResolvedValue(mockStore);

      const result = await service.remove('1', '1');

      expect(result.message).toBe('Store deleted successfully');
      expect(mockPrismaService.store.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw ForbiddenException if user is not store owner', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue({
        ...mockStore,
        ownerId: '2',
      });

      await expect(service.remove('1', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
