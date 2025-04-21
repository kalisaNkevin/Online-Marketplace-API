import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import {
  StoreResponseDto,
  StoreProductDto,
  StoreOwnerDto,
  StoreMetricsDto,
} from './dto/store-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('StoresController', () => {
  let controller: StoresController;
  let service: jest.Mocked<Partial<StoresService>>;

  const mockStoreProduct: StoreProductDto = {
    id: '1',
    name: 'Test Product',
    price: new Decimal('100.00'),
  };

  const mockStoreOwner: StoreOwnerDto = {
    name: 'Test Owner',
    email: 'owner@test.com',
  };

  const mockStoreMetrics: StoreMetricsDto = {
    totalProducts: 1,
    averageProductRating: 0,
  };

  const mockStore = {
    id: '1',
    name: 'Test Store',
    description: 'Test Description', // Required field
    ownerId: '1',
    owner: {
      name: 'Test Owner',
      email: 'owner@test.com'
    },
    products: [{
      id: '1',
      name: 'Test Product',
      price: new Decimal('100.00')
    }],
    metrics: {
      totalProducts: 1,
      averageProductRating: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  } as StoreResponseDto;

  beforeEach(async () => {
    const mockStoresService = {
      create: jest.fn().mockResolvedValue(mockStore),
      findAll: jest.fn().mockResolvedValue({
        data: [mockStore],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }),
      findOne: jest.fn().mockResolvedValue(mockStore),
      findByUser: jest.fn(),
      update: jest.fn().mockImplementation((id, userId, dto) => ({
        ...mockStore,
        ...dto,
        description: dto.description || mockStore.description // Preserve description if not updated
      })),
      remove: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: mockStoresService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    service = module.get(StoresService);
  });

  describe('create', () => {
    const createStoreDto: CreateStoreDto = {
      name: 'Test Store',
      description: 'Test Description',
    };

    it('should create a store for sellers', async () => {
      const req = {
        user: { sub: '1', role: Role.SELLER },
      };

      service.create.mockResolvedValue(mockStore);

      const result = await controller.create(req, createStoreDto);

      expect(result).toEqual(mockStore);
      expect(service.create).toHaveBeenCalledWith(req.user.sub, createStoreDto);
    });

    it('should throw ForbiddenException for non-sellers', async () => {
      const req = {
        user: { sub: '1', role: Role.SHOPPER },
      };

      await expect(controller.create(req, createStoreDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      const paginatedResponse = {
        data: [mockStore],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      service.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll();

      expect(result).toEqual(paginatedResponse);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findMyStore', () => {
    it('should return user stores', async () => {
      const req = {
        user: { sub: '1' },
      };

      service.findByUser.mockResolvedValue({
        data: [mockStore],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      const result = await controller.findMyStore(req);

      expect(result.data).toEqual([mockStore]);
      expect(service.findByUser).toHaveBeenCalledWith(
        req.user.sub,
        expect.any(Object),
      );
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const req = {
        user: { sub: '1' },
      };

      const updateStoreDto: UpdateStoreDto = {
        name: 'Updated Store',
      };

      service.update.mockResolvedValue({
        ...mockStore,
        ...updateStoreDto,
      });

      const result = await controller.update('1', req, updateStoreDto);

      expect(result.name).toBe(updateStoreDto.name);
      expect(service.update).toHaveBeenCalledWith(
        '1',
        req.user.sub,
        updateStoreDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a store', async () => {
      const req = {
        user: { sub: '1' },
      };

      service.remove.mockResolvedValue({
        message: 'Store deleted successfully',
      });

      const result = await controller.remove('1', req);

      expect(result.message).toBe('Store deleted successfully');
      expect(service.remove).toHaveBeenCalledWith('1', req.user.sub);
    });
  });
});
