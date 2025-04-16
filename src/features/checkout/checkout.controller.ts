import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';


@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Create checkout from cart' })
  @ApiResponse({
    status: 201,
    description: 'Checkout created successfully',
  })
  async createCheckout(
    @Request() req,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    return await this.checkoutService.createCheckout(
      req.user.sub,
      createCheckoutDto,
    );
  }
}