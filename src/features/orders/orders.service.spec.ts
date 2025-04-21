import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../../email/email.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentDto } from './dto/payment.dto';
import { CreateReviewDto } from '../products/dto/create-review.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let emailService: EmailService;

  const mockOrder = {
    id: '1',
    userId: '1',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.MOMO_MTN,
    paymentReference: 'ref123',
    total: '1000',
    items: [
      {
        id: '1',
        productId: '1',
        quantity: 2,
        price: '500',
        total: '1000',
        product: {
          id: '1',
          name: 'Test Product',
          price: 500,
          store: {
            id: '1',
            name: 'Test Store',
          },
        },
      },
    ],
    shippingAddress: {
      fullName: 'Test User',
      street: 'Test Street',
      city: 'Test City',
      country: 'Test Country',
      phone: '+250780123456',
    },
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+250780123456',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    orderStatusHistory: {  // Add this mock
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockEmailService = {
    sendOrderConfirmation: jest.fn(),
    sendOrderStatusUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  describe('getOrderById', () => {
    it('should return an order', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('1');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockOrder.id);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      // Arrange
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.orderStatusHistory.create.mockResolvedValue({
        id: '1',
        orderId: '1',
        status: OrderStatus.PROCESSING,
        comment: 'Order status updated from PENDING to PROCESSING',
        createdAt: new Date()
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      // Act
      const result = await service.updateOrderStatus(
        '1',
        '1',
        OrderStatus.PROCESSING,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(mockPrismaService.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: '1',
          status: OrderStatus.PROCESSING,
          comment: 'Order status updated from PENDING to PROCESSING'
        }
      });
    });

    it('should throw ForbiddenException for invalid user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus('1', '999', OrderStatus.PROCESSING),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addReview', () => {
    const reviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Great product!',
        productId: '1',
        orderId: '1',
        storeId: '1',
        userId: '1'
    };

    it('should add a review to an order', async () => {
      // Arrange
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.COMPLETED,
      });

      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.findMany.mockResolvedValue([
        { rating: 4 },
        { rating: 5 }
      ]); // Add mock reviews for average calculation
      mockPrismaService.review.create.mockResolvedValue({
        id: '1',
        ...reviewDto,
        userId: '1',
        orderId: '1',
      });
      mockPrismaService.product.update.mockResolvedValue({ id: '1' });

      // Act
      const result = await service.addReview('1', '1', reviewDto);

      // Assert
      expect(result).toBeDefined();
      expect(mockPrismaService.review.create).toHaveBeenCalled();
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { averageRating: 4.5 } // (4 + 5) / 2
      });
    });

    it('should throw BadRequestException for incomplete order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.addReview('1', '1', reviewDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
