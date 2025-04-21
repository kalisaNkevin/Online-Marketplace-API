import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Role } from '@prisma/client';
import { QueryStoreDto } from './dto/query-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('StoresService', () => {
  let service: StoresService;
  let prismaService: PrismaService;

  const mockStore: StoreResponseDto = {
    id: '1',
    name: 'Test Store',
    description: 'Test Description',
    ownerId: '1',
    owner: {
      name: 'Test Owner',
      email: 'owner@test.com'
    },
    products: [],
    metrics: {
      totalProducts: 0,
      averageProductRating: 0
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    store: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([mockStore]),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
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
