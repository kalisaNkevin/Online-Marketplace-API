import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed' })
  @ApiResponse({ status: 409, description: 'Email already subscribed' })
  async subscribe(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.subscribe(dto);
  }

  @Post('unsubscribe/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed' })
  async unsubscribe(@Param('email') email: string) {
    return this.subscriptionsService.unsubscribe(email);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'Returns all subscriptions' })
  async findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Returns the subscription' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
