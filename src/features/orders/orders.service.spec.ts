import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigModule } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/database/prisma.service';
import { ORDERS_SERVICE } from './constants';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let ordersQueue: Queue;

  const mockOrder = {
    id: '1',
    userId: '1',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.MOMO_MTN,
    paymentReference: 'ref123',
    total: new Decimal(1000),
    items: [
      {
        id: '1',
        orderId: '1',
        productId: '1',
        quantity: 2,
        size: 'MEDIUM',
        price: new Decimal(500),
        priceAtPurchase: new Decimal(500),
        total: new Decimal(1000),
        product: {
          id: '1',
          name: 'Test Product',
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
      province: '',
    },
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+250780123456',
    },
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    cancelledAt: null,
    statusMessage: null,
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        BullModule.registerQueue({
          name: 'orders',
        }),
      ],
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('orders'),
          useValue: mockQueue,
        },
        {
          provide: ORDERS_SERVICE,
          useValue: {
            processOrder: jest.fn(),
            updateOrderStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    ordersQueue = module.get<Queue>(getQueueToken('orders'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderById', () => {
    it('should return an order', async () => {
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
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      const result = await service.updateOrderStatus(
        '1',
        '1',
        OrderStatus.PROCESSING,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(mockPrismaService.orderStatusHistory.create).toHaveBeenCalled();
    });
  });

  // Add other test cases as needed
});
