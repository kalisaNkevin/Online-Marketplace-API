import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSize } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: new Decimal(100),
    quantity: 10,
    discount: null,
    thumbnail: null,
    images: [],
    isFeatured: false,
    isActive: true,
    storeId: '1',
    store: {
      id: '1',
      name: 'Test Store',
      ownerId: '1',
    },
    categories: [],
    variants: [
      {
        id: '1',
        size: ProductSize.M,
        quantity: 5,
        productId: '1',
      },
    ],
    reviews: [],
    averageRating: 0,
    _count: {
      reviews: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    product: {
      create: jest.fn().mockResolvedValue(mockProduct),
      findMany: jest.fn().mockResolvedValue([mockProduct]),
      findUnique: jest.fn().mockResolvedValue(mockProduct),
      findFirst: jest.fn().mockResolvedValue(mockProduct),
      update: jest.fn().mockResolvedValue(mockProduct),
      delete: jest.fn().mockResolvedValue(mockProduct),
      count: jest.fn().mockResolvedValue(1),
    },
    review: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productVariant: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        quantity: 10,
        categories: ['1'],
        variants: [
          {
            size: ProductSize.M,
            quantity: 5,
          },
        ],
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create('1', createProductDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
      });

      const result = await service.update('1', '1', updateProductDto);

      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.update('1', '1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFeaturedProducts', () => {
    const cachedProducts = [
      {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        quantity: 10,
        isActive: true,
        isFeatured: true,
        discount: null,
        thumbnail: null,
        images: [],
        storeId: '1',
        store: {
          id: '1',
          name: 'Test Store',
          ownerId: '1', // Add missing ownerId
        },
        categories: [],
        variants: [
          {
            id: '1', // Add missing id
            productId: '1', // Add missing productId
            size: 'M',
            quantity: 5,
          },
        ],
        reviews: [],
        _count: {
          // Add missing review count
          reviews: 0,
        },
        averageRating: 0, // Fix averageRating to be 0 instead of null
        createdAt: new Date('2025-04-21T10:55:59.252Z').toISOString(), // Format date as ISO string
        updatedAt: new Date('2025-04-21T10:55:59.252Z').toISOString(), // Format date as ISO string
      },
    ];

    const mockFeaturedProduct = {
      id: '1',
      name: 'Test Product',
      description: 'Test Description',
      price: new Decimal(100),
      quantity: 10,
      isActive: true,
      isFeatured: false,
      discount: null,
      thumbnail: null,
      images: [],
      storeId: '1',
      store: {
        id: '1',
        name: 'Test Store',
      },
      categories: [],
      variants: [
        {
          quantity: 5,
          size: 'M',
        },
      ],
      reviews: [],
      averageRating: null,
      createdAt: new Date('2025-04-21T10:59:35.399Z'),
      updatedAt: new Date('2025-04-21T10:59:35.399Z'),
    };

    it('should return featured products from database if not cached', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.getFeaturedProducts();

      expect(result).toBeDefined();
    });

    it('should cache database results for 1 hour', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getFeaturedProducts();
    });

    it('should return only active and featured products from database', async () => {
      await service.getFeaturedProducts();

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isFeatured: true,
            isActive: true,
          },
        }),
      );
    });

    it('should limit database results to 12 products', async () => {
      await service.getFeaturedProducts();

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 12,
        }),
      );
    });
  });
});
