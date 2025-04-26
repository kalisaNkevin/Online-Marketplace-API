import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { PaginatedResponse, StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Role } from '@prisma/client';
import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  StoreResponseDto,
  StoreProductDto,
  StoreOwnerDto,
  StoreMetricsDto,
} from './dto/store-response.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { RolesGuard } from '@/auth/guards/roles.guard';

describe('StoresController', () => {
  let controller: StoresController;
  let service: jest.Mocked<StoresService>;

  // Mock Data
  const createMockData = () => {
    const mockStoreProduct: StoreProductDto = {
      id: '1',
      name: 'Test Product',
      price: 500, // Changed from string to number
      averageRating: 90, // Changed from string to number
    };

    const mockStoreOwner: StoreOwnerDto = {
      id: '1',
      name: 'Test Owner',
      email: 'owner@test.com',
    };

    const mockStoreMetrics: StoreMetricsDto = {
      totalProducts: 1,
      averageProductRating: 0,
    };

    const mockStore: StoreResponseDto = {
      id: '1',
      name: 'Test Store',
      description: 'Test Description',
      owner: mockStoreOwner,
      products: [mockStoreProduct],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPaginatedResponse: PaginatedResponse<StoreResponseDto> = {
      data: [mockStore],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    return {
      mockStore,
      mockPaginatedResponse,
      mockStoreProduct,
      mockStoreOwner,
      mockStoreMetrics,
    };
  };

  // Setup
  beforeEach(async () => {
    const { mockStore, mockPaginatedResponse } = createMockData();

    const mockStoresService = {
      create: jest.fn().mockImplementation((userId, dto) => {
        return Promise.resolve(mockStore);
      }),
      findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
      findOne: jest.fn().mockResolvedValue(mockStore),
      findByOwnerId: jest.fn().mockResolvedValue([mockStore]), // Return array with store
      update: jest.fn().mockImplementation((id, userId, dto) => ({
        ...mockStore,
        ...dto,
      })),
      remove: jest
        .fn()
        .mockResolvedValue({ message: 'Store deleted successfully' }),
      calculateStoreMetrics: jest.fn().mockReturnValue({
        totalProducts: 1,
        averageProductRating: 0,
      }),
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

  // Test Cases
  describe('CRUD Operations', () => {
    const { mockStore } = createMockData();

    describe('create', () => {
      const createStoreDto: CreateStoreDto = {
        name: 'Test Store',
        description: 'Test Description',
      };

      it('should create a store for sellers', async () => {
        const req = {
          user: {
            id: '1', // Changed from sub to id
            role: Role.SELLER,
          },
        };
        const result = await controller.create(req, createStoreDto);

        // Use toMatchObject instead of toEqual to handle date comparison
        expect(result).toMatchObject({
          ...mockStore,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        expect(service.create).toHaveBeenCalledWith(
          req.user.id,
          createStoreDto,
        );
      });

      it('should throw ForbiddenException for non-sellers', async () => {
        // Create test module with RolesGuard
        const moduleRef = await Test.createTestingModule({
          controllers: [StoresController],
          providers: [
            {
              provide: StoresService,
              useValue: service,
            },
          ],
        })
          .overrideGuard(RolesGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
              if (req.user.role !== Role.SELLER) {
                throw new ForbiddenException('Only sellers can create stores');
              }
              return true;
            },
          })
          .compile();

        const testController =
          moduleRef.get<StoresController>(StoresController);

        const req = {
          user: {
            id: '1',
            role: Role.SHOPPER,
          },
        };

        await expect(
          testController.create(req, createStoreDto),
        ).rejects.toThrow(ForbiddenException);
        // Remove service call expectation since guard prevents it
      });
    });

    describe('read operations', () => {
      const { mockPaginatedResponse } = createMockData();
      const defaultQuery = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      it('should find all stores with default pagination', async () => {
        const result = await controller.findAll();
        expect(result).toMatchObject({
          data: [
            {
              ...mockStore,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            },
          ],
          pagination: expect.any(Object),
        });
        expect(service.findAll).toHaveBeenCalledWith(defaultQuery);
      });

      it('should find one store by id', async () => {
        const result = await controller.findOne('1');
        expect(result).toMatchObject({
          ...mockStore,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        expect(service.findOne).toHaveBeenCalledWith('1');
      });

      it('should find stores by user', async () => {
        const req = { user: { id: '1' } }; // Changed from sub to id
        const result = await controller.findMyStore(req);
        expect(result).toMatchObject({
          ...mockStore,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        expect(service.findByOwnerId).toHaveBeenCalledWith(
          // Changed from findOne
          req.user.id,
        );
      });

      it('should find store by user', async () => {
        const req = { user: { id: '1' } };
        const result = await controller.findMyStore(req);

        expect(result).toMatchObject({
          ...mockStore,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        expect(service.findByOwnerId).toHaveBeenCalledWith(req.user.id);
      });
    });

    describe('update', () => {
      it('should update a store', async () => {
        const req = { user: { sub: '1' } };
        const updateDto: UpdateStoreDto = { name: 'Updated Store' };
        const result = await controller.update('1', req, updateDto);

        expect(result.name).toBe(updateDto.name);
        expect(service.update).toHaveBeenCalledWith(
          '1',
          req.user.sub,
          updateDto,
        );
      });
    });

    describe('remove', () => {
      it('should remove a store', async () => {
        const req = { user: { sub: '1' } };
        const result = await controller.remove('1', req);

        expect(result.message).toBe('Store deleted successfully');
        expect(service.remove).toHaveBeenCalledWith('1', req.user.sub);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent store', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
