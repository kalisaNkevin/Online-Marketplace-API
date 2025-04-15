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
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guards';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order has been successfully created',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid order data or insufficient stock' 
  })
  async createOrder(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return await this.ordersService.createOrder(req.user.sub, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of orders',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: OrderStatus,
    description: 'Filter orders by status' 
  })
  async getOrders(
    @Request() req,
    @Query() query: QueryOrderDto
  ) {
    return await this.ordersService.getOrders(req.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns order details',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @Request() req,
    @Param('id') orderId: string
  ) {
    return await this.ordersService.getOrderById(orderId, req.user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({
    status: 200,
    description: 'Order status has been updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Request() req,
    @Param('id') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    return await this.ordersService.updateOrderStatus(
      orderId,
      req.user.sub,
      updateOrderDto
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({
    status: 200,
    description: 'Order has been cancelled',
  })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Request() req,
    @Param('id') orderId: string
  ) {
    return await this.ordersService.cancelOrder(orderId, req.user.sub);
  }
}
