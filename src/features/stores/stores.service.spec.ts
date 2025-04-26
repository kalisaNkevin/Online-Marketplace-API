import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { Role } from '@prisma/client';

describe('StoresService', () => {
  let service: StoresService;
  let prismaService: PrismaService;

  const mockStore = {
    id: '1',
    name: 'Test Store',
    description: 'Test Description',
    ownerId: '1',
    owner: {
      id: '1',
      name: 'Test Owner',
      email: 'owner@test.com',
    },
    products: [
      {
        id: '1',
        name: 'Test Product',
        price: new Decimal(100),
        averageRating: new Decimal(4.5),
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      },
    ],
    _count: {
      products: 1,
    },
    metrics: {
      totalProducts: 1,
      averageProductRating: 4.5,
    },
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const prismaServiceMock = {
      store: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: '1',
          role: Role.SELLER,
          name: 'Test Owner',
          email: 'owner@test.com',
        }),
      },
      $transaction: jest.fn((cb) => cb(prismaServiceMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Setup default mock implementations
    jest.spyOn(prismaService.store, 'findMany').mockResolvedValue([mockStore]);
    jest.spyOn(prismaService.store, 'findFirst').mockResolvedValue(mockStore);
    jest.spyOn(prismaService.store, 'findUnique').mockResolvedValue(mockStore);
    jest.spyOn(prismaService.store, 'create').mockResolvedValue(mockStore);
    jest.spyOn(prismaService.store, 'update').mockResolvedValue(mockStore);
    jest.spyOn(prismaService.store, 'delete').mockResolvedValue(mockStore);
    jest.spyOn(prismaService.store, 'count').mockResolvedValue(1);
  });

  describe('calculateStoreMetrics', () => {
    it('should calculate metrics correctly', () => {
      const store = {
        products: [{ averageRating: 4 }, { averageRating: 4 }],
      };

      const result = service['calculateStoreMetrics'](store);
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
      // Define the exact expected arguments
      const expectedFindManyArgs = {
        skip: 0,
        take: 10,
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true, // Added id to match service implementation
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
      };

      // Setup mocks
      jest
        .spyOn(prismaService.store, 'findMany')
        .mockResolvedValue([mockStore]);
      jest.spyOn(prismaService.store, 'count').mockResolvedValue(1);

      // Execute test
      const result = await service.findAll({ page: 1, limit: 10 });

      // Verify results
      expect(result.data).toHaveLength(1);
      expect(prismaService.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining(expectedFindManyArgs),
      );
    });
  });

  describe('findByOwnerId', () => {
    const userId = '1';

    beforeEach(() => {
      // Reset mocks for each test
      jest.spyOn(prismaService.store, 'findMany').mockReset();
      jest.spyOn(prismaService.store, 'count').mockReset();
    });

    it('should return user stores with pagination', async () => {
      const mockStores = [
        {
          ...mockStore,
          _count: { products: 1 },
          metrics: {
            totalProducts: 1,
            averageProductRating: 4.5,
          },
        },
      ];

      // Update mock implementations
      jest.spyOn(prismaService.store, 'findMany').mockResolvedValue(mockStores);
      jest.spyOn(prismaService.store, 'count').mockResolvedValue(1);

      const result = await service.findByOwnerId(userId);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Test Store',
        _count: { products: 1 },
        metrics: {
          totalProducts: 1,
          averageProductRating: 4.5,
        },
      });
    });

    it('should return empty array when user has no stores', async () => {
      // Update mock implementations for empty results
      jest.spyOn(prismaService.store, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.store, 'count').mockResolvedValue(0);

      const result = await service.findByOwnerId(userId);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateStoreOwnership', () => {
    it('should throw ForbiddenException when user is not store owner', async () => {
      jest.spyOn(prismaService.store, 'findUnique').mockResolvedValueOnce({
        ...mockStore,
        ownerId: '2',
      });

      await expect(
        (service as any).validateStoreOwnership('1', '1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return store when user is owner', async () => {
      jest
        .spyOn(prismaService.store, 'findUnique')
        .mockResolvedValueOnce(mockStore);

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

      const expectedArgs = {
        data: {
          ...createStoreDto,
          owner: {
            connect: {
              id: '1',
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
      };

      jest.spyOn(prismaService.store, 'create').mockResolvedValue(mockStore);

      const result = await service.create('1', createStoreDto);

      expect(result).toEqual(mockStore);
      expect(prismaService.store.create).toHaveBeenCalledWith(expectedArgs);
    });
  });

  describe('findOne', () => {
    it('should return a store', async () => {
      jest
        .spyOn(prismaService.store, 'findUnique')
        .mockResolvedValue(mockStore);

      const result = await service.findOne('1');

      expect(result).toEqual(mockStore);
      expect(prismaService.store.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      jest.spyOn(prismaService.store, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateStoreDto: UpdateStoreDto = {
      name: 'Updated Store',
    };

    it('should update a store', async () => {
      jest
        .spyOn(prismaService.store, 'findUnique')
        .mockResolvedValue(mockStore);
      jest.spyOn(prismaService.store, 'update').mockResolvedValue({
        ...mockStore,
        ...updateStoreDto,
      });

      const result = await service.update('1', '1', updateStoreDto);

      expect(result.name).toBe(updateStoreDto.name);
      expect(prismaService.store.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateStoreDto,
      });
    });

    it('should throw ForbiddenException if user is not store owner', async () => {
      jest.spyOn(prismaService.store, 'findUnique').mockResolvedValue({
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
      jest
        .spyOn(prismaService.store, 'findUnique')
        .mockResolvedValue(mockStore);
      jest.spyOn(prismaService.store, 'delete').mockResolvedValue(mockStore);

      const result = await service.remove('1', '1');

      expect(result.message).toBe('Store deleted successfully');
      expect(prismaService.store.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw ForbiddenException if user is not store owner', async () => {
      jest.spyOn(prismaService.store, 'findUnique').mockResolvedValue({
        ...mockStore,
        ownerId: '2',
      });

      await expect(service.remove('1', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
