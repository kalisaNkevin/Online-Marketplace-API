import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { CreateReviewDto } from '../products/dto/create-review.dto';
import { ProductEntity } from '../products/entities/product.entity';
import { ReviewEntity } from '../products/entities/review.entity';

// OrderItemEntity interface
interface OrderItemEntity {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  priceAtPurchase: string;
  total: string;
  product: ProductEntity;
}

// OrderEntity interface
interface OrderEntity {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  total: string;
  items: OrderItemEntity[];
  shippingAddress: string[];
  user: string[];
  reviews: ReviewEntity[];
  createdAt: Date;
  updatedAt: Date;
}

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<Partial<OrdersService>>;

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
        productName: 'Test Product', // Added missing property
        quantity: 2,
        price: '500',
        priceAtPurchase: '500', // Added missing property
        total: '1000',
        product: {
          id: '1',
          name: 'Test Product',
          price: 500,
          description: 'Test description',
          images: ['image.jpg'],
          quantity: 10,
          store: {
            id: '1',
            name: 'Test Store',
            userId: '1'
          }
        }
      }
    ],
    shippingAddress: {
      fullName: 'Test User',
      street: 'Test Street',
      city: 'Test City',
      country: 'Test Country',
      phone: '+250780123456',
      province: ''
    },
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+250780123456'
    },
    reviews: [], // Added missing reviews property
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const mockOrdersService = {
      createOrder: jest.fn(),
      getOrderById: jest.fn(),
      getShopperOrders: jest.fn(),
      getStoreOrders: jest.fn(),
      getAllOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      adminUpdateOrderStatus: jest.fn(),
      sellerUpdateOrderStatus: jest.fn(),
      addReview: jest.fn(),
      shopperCancelOrder: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService
        }
      ]
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const createOrderDto: CreateOrderDto = {
        items: [
          {
            productId: '1',
            quantity: 2
          }
        ],
        shippingAddress: {
            fullName: 'Test User',
            street: 'Test Street',
            city: 'Test City',
            country: 'Test Country',
            phone: '+250780123456',
            province: ''
        },
        payment: {
          method: PaymentMethod.MOMO_MTN,
          phoneNumber: '+250780123456'
        }
      };

      const req = {
        user: { id: '1', role: Role.SHOPPER }
      };

      ordersService.createOrder.mockResolvedValue(mockOrder);

      const result = await controller.createOrder(req, createOrderDto);

      expect(result).toBeDefined();
      expect(ordersService.createOrder).toHaveBeenCalledWith(
        req.user.id,
        createOrderDto
      );
    });
  });

  describe('getMyOrders', () => {
    it('should return shopper orders', async () => {
      const req = {
        user: { id: '1', role: Role.SHOPPER }
      };

      const query = { page: 1, limit: 10 };

      ordersService.getShopperOrders.mockResolvedValue({
        data: [mockOrder],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });

      const result = await controller.getMyOrders(req, query);

      expect(result).toBeDefined();
      expect(ordersService.getShopperOrders).toHaveBeenCalledWith(
        req.user.id,
        query
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status as admin', async () => {
      const req = {
        user: { id: '1', role: Role.ADMIN }
      };

      const updateOrderDto: UpdateOrderDto = {
        status: OrderStatus.PROCESSING
      };

      ordersService.adminUpdateOrderStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateOrderStatus(
        req,
        '1',
        updateOrderDto
      );

      expect(result).toBeDefined();
      expect(ordersService.adminUpdateOrderStatus).toHaveBeenCalledWith(
        '1',
        updateOrderDto
      );
    });

    it('should update order status as seller', async () => {
      const req = {
        user: { id: '1', role: Role.SELLER, storeId: '1' }
      };

      const updateOrderDto: UpdateOrderDto = {
        status: OrderStatus.PROCESSING
      };

      ordersService.sellerUpdateOrderStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateOrderStatus(
        req,
        '1',
        updateOrderDto
      );

      expect(result).toBeDefined();
      expect(ordersService.sellerUpdateOrderStatus).toHaveBeenCalledWith(
        '1',
        req.user.storeId,
        updateOrderDto
      );
    });

    it('should return null if user not found', async () => {
      const req = {
        user: { id: '999', role: Role.ADMIN }
      };

      const updateOrderDto: UpdateOrderDto = {
        status: OrderStatus.PROCESSING
      };

      ordersService.adminUpdateOrderStatus.mockResolvedValue(null);

      const result = await controller.updateOrderStatus(
        req,
        '1',
        updateOrderDto
      );

      expect(result).toBeNull();
      expect(ordersService.adminUpdateOrderStatus).toHaveBeenCalledWith(
        '1',
        updateOrderDto
      );
    });
  });

  describe('addReview', () => {
    it('should add a review to an order', async () => {
      const req = {
        user: { id: '1', role: Role.SHOPPER }
      };

      const reviewDto: CreateReviewDto = {
          rating: 5,
          comment: 'Great product!',
          productId: '1',
          orderId: '',
          storeId: '',
          userId: ''
      };

      ordersService.addReview.mockResolvedValue({
        id: '1',
        ...reviewDto
      });

      const result = await controller.addReview(req, '1', reviewDto);

      expect(result).toBeDefined();
      expect(result.message).toBe('Review added successfully');
      expect(ordersService.addReview).toHaveBeenCalledWith(
        '1',
        req.user.id,
        reviewDto
      );
    });
  });
});