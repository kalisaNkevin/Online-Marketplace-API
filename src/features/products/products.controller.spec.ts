import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ForbiddenException, Query } from '@nestjs/common';
import { Role, ProductSize } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/database/prisma.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<Partial<ProductsService>>;
  let prisma: PrismaService;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: new Decimal(100),
    quantity: 10,
    storeId: '1',
    categories: [],
    variants: [],
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    discount: null,
    thumbnail: null,
    images: [],
    isFeatured: false,
    isActive: true,
    averageRating: 0,
    store: {
      id: '1',
      name: 'Test Store',
      ownerId: '1',
    },
    _count: {
      reviews: 0,
    },
  };

  beforeEach(async () => {
    const mockProductsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getFeaturedProducts: jest.fn(),
      toggleFeaturedStatus: jest.fn(),
      findProductReviews: jest.fn(),
      updateReview: jest.fn(),
      delete: jest.fn(),
    };

    const mockPrismaService = {
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      store: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a product for sellers', async () => {
      const req = {
        user: { id: '1', role: Role.SELLER },
      };

      const mockStore = {
        id: '1',
        name: 'Test Store',
        ownerId: '1',
      };

      const mockCategories = [{ id: '1', name: 'Category 1' }];

      (prisma.store.findFirst as jest.Mock).mockResolvedValue(mockStore);
      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
      service.create.mockResolvedValue(mockProduct);

      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 100,
        quantity: 10,
        categories: ['1'],
        variants: [{ size: ProductSize.M, quantity: 5 }],
      };

      const result = await controller.create(req, createProductDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(
        mockStore.id,
        createProductDto,
      );
    });

    it('should throw ForbiddenException if seller has no store', async () => {
      const req = {
        user: { id: '1', role: Role.SELLER },
      };

      (prisma.store.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.create(req, {} as CreateProductDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProductReviews', () => {
    it('should get reviews for a product', async () => {
      const mockReviews = [
        {
          id: '1',
          content: 'Great product',
          rating: 5,
          userId: '1',
          productId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.findProductReviews.mockResolvedValue(mockReviews);
      const result = await controller.getProductReviews('1');
      expect(result).toEqual(mockReviews);
      expect(service.findProductReviews).toHaveBeenCalledWith('1');
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const mockReview = {
        id: '1',
        content: 'Updated review',
        rating: 4,
        userId: '1',
        productId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto = {
        content: 'Updated review',
        rating: 4,
      };

      service.updateReview.mockResolvedValue(mockReview);
      const result = await controller.updateReview('1', '1', updateDto);
      expect(result).toEqual(mockReview);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      service.findOne.mockResolvedValue(mockProduct);
      const result = await controller.findOne('1');
      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should return product with variants', async () => {
      const productWithVariants = {
        ...mockProduct,
        variants: [
          {
            id: '1',
            size: ProductSize.M,
            quantity: 5,
            productId: '1',
          },
        ],
      };
      service.findOne.mockResolvedValue(productWithVariants);
      const result = await controller.findOne('1');
      expect(result.variants).toBeDefined();
      expect(result.variants.length).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const req = { user: { storeId: '1' } };
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };

      service.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
      });

      const result = await controller.update(req, '1', updateProductDto);
      expect(result.name).toBe('Updated Product');
    });

    it('should throw ForbiddenException if store ID does not match', async () => {
      const req = { user: { storeId: '2' } };
      service.update.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(req, '1', { name: 'Updated Product' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const req = { user: { storeId: '1' } };
      service.remove.mockResolvedValue({
        message: 'Product deleted successfully',
      });

      const result = await controller.remove(req, '1');
      expect(result.message).toBe('Product deleted successfully');
    });
  });

  describe('toggleFeaturedStatus', () => {
    it('should toggle product featured status', async () => {
      service.toggleFeaturedStatus.mockResolvedValue({
        ...mockProduct,
        isFeatured: true,
      });

      const result = await controller.toggleFeaturedStatus('1', '1', true);
      expect(result.isFeatured).toBe(true);
    });
  });
});
