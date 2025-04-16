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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';


@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a product review' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 201,
    description: 'Review has been successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid review data or not eligible to review',
  })
  async create(
    @Request() req,
    @Param('productId') productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return await this.reviewsService.create(
      req.user.sub,
      productId,
      createReviewDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all reviews for the product',
  })
  async findProductReviews(@Param('productId') productId: string) {
    return await this.reviewsService.findProductReviews(productId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review has been successfully updated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not review owner',
  })
  async update(
    @Request() req,
    @Param('id') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewsService.update(
      req.user.sub,
      reviewId,
      updateReviewDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review has been successfully deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not review owner',
  })
  async delete(@Request() req, @Param('id') reviewId: string) {
    return await this.reviewsService.delete(req.user.sub, reviewId);
  }
}
