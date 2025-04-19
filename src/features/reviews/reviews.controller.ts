import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
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
  ApiBody,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { ReviewEntity } from './entities/review.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews/products/:productId')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new review for a product (Authenticated)',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the product',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully',
    type: ReviewEntity,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid review data or user not eligible to review',
  })
  async createReview(
    @Request() req,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewEntity> {
    return await this.reviewsService.create(
      req.user.sub,
      productId,
      createReviewDto,
    );
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all reviews for a product (Public)' })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the product',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of reviews retrieved successfully',
    type: [ReviewEntity],
  })
  async getProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ReviewEntity[]> {
    return await this.reviewsService.findProductReviews(productId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing review (Authenticated)' })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the product',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the review',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review updated successfully',
    type: ReviewEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found or not owned by user',
  })
  async updateReview(
    @Request() req,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewEntity> {
    return await this.reviewsService.update(
      req.user.sub,
      reviewId,
      updateReviewDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a review (Authenticated)' })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the product',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the review',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found or not owned by user',
  })
  async deleteReview(
    @Request() req,
    @Param('id', ParseUUIDPipe) reviewId: string,
  ) {
    return await this.reviewsService.delete(req.user.sub, reviewId);
  }
}
