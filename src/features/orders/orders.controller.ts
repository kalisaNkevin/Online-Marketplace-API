import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';

import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { OrderEntity } from './entities/order.entity';
import { PaginatedOrdersResponse } from './interfaces/paginated-orders-response.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles([Role.SHOPPER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
    type: OrderEntity,
  })
  async createOrder(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderEntity> {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  @Roles([Role.SHOPPER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shopper order history' })
  @ApiQuery({ type: QueryOrderDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated list of orders',
    type: PaginatedOrdersResponse,
  })
  async getMyOrders(
    @Request() req,
    @Query() query: QueryOrderDto,
  ): Promise<PaginatedOrdersResponse> {
    return this.ordersService.getShopperOrders(req.user.id, query);
  }

  @Get('store-orders')
  @Roles([Role.SELLER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller store orders' })
  @ApiQuery({ type: QueryOrderDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated list of store orders',
    type: PaginatedOrdersResponse,
  })
  async getStoreOrders(
    @Request() req,
    @Query() query: QueryOrderDto,
  ): Promise<PaginatedOrdersResponse> {
    return this.ordersService.getStoreOrders(req.user.storeId, query);
  }

  @Get('admin/all')
  @Roles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiQuery({ type: QueryOrderDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated list of all orders',
    type: PaginatedOrdersResponse,
  })
  async getAllOrders(
    @Query() query: QueryOrderDto,
  ): Promise<PaginatedOrdersResponse> {
    return this.ordersService.getAllOrders(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns order details',
    type: OrderEntity,
  })
  async getOrderById(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
  ): Promise<OrderEntity> {
    if (req.user.role === Role.ADMIN) {
      return this.ordersService.getOrderById(orderId);
    }
    if (req.user.role === Role.SELLER) {
      return this.ordersService.getStoreOrderById(orderId, req.user.storeId);
    }
    return this.ordersService.getShopperOrderById(orderId, req.user.id);
  }

  @Post(':id/reviews')
  @Roles([Role.SHOPPER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add review to order' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review added successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Review added successfully',
        },
        review: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rating: { type: 'number' },
            comment: { type: 'string' },
          },
        },
      },
    },
  })
  async addReview(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() reviewDto: CreateReviewDto,
  ): Promise<{ message: string; review: any }> {
    const review = await this.ordersService.addReview(
      orderId,
      req.user.id,
      reviewDto,
    );
    return {
      message: 'Review added successfully',
      review,
    };
  }

  @Patch(':id/cancel')
  @Roles([Role.SHOPPER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order cancelled successfully',
    type: OrderEntity,
  })
  async cancelOrder(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
  ): Promise<OrderEntity> {
    return this.ordersService.shopperCancelOrder(orderId, req.user.id);
  }

  @Patch(':id/status')
  @Roles([Role.SELLER, Role.ADMIN])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status updated successfully',
    type: OrderEntity,
  })
  async updateOrderStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    if (req.user.role === Role.ADMIN) {
      return this.ordersService.adminUpdateOrderStatus(orderId, updateOrderDto);
    }
    return this.ordersService.sellerUpdateOrderStatus(
      orderId,
      req.user.storeId,
      updateOrderDto,
    );
  }
}
