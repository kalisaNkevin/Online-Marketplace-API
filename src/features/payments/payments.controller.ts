import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Process payment for an order' })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order or phone number',
  })
  async processPayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return await this.paymentsService.processPayment(
      req.user.sub,
      createPaymentDto,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle PayPack webhook' })
  async handleWebhook(
    @Headers('x-paypack-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ) {
    // Implement webhook handling
    return { received: true };
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment transactions' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of transactions',
  })
  async getTransactions(@Request() req, @Query() query: QueryTransactionDto) {
    return await this.paymentsService.getTransactions(req.user.sub, query);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiResponse({
    status: 200,
    description: 'Returns transaction details',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async getTransactionById(@Request() req, @Param('id') id: string) {
    return await this.paymentsService.getTransactionById(req.user.sub, id);
  }
}
