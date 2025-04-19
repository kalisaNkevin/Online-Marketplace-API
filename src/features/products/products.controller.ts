import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guards';

import { Role } from '@prisma/client';
import { QueryProductDto } from './dto/query-product.dto';

import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  PaginatedProductsResponse,
  ProductResponseDto,
} from './dto/product-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { AdminUpdateProductDto } from './dto/admin-update-product.dto';
import { ProductEntity } from './entities/product.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles([Role.SELLER])
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (Sellers only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Sellers only',
  })
  async create(
    @Request() req,
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // Verify storeId exists in request
    if (!req.user?.storeId) {
      throw new ForbiddenException('Seller must have an associated store');
    }
    return this.productsService.create(req.user.storeId, createProductDto);
  }

  // Public endpoint - anyone can access
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all products (Public)',
    description: 'Search, filter and paginate through products',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated products',
    type: PaginatedProductsResponse,
  })
  async findAll(@Query() query: QueryProductDto): Promise<{
    data: ProductResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({
    status: 200,
    description: 'Returns featured products',
    type: [ProductEntity],
  })
  async getFeaturedProducts(): Promise<ProductEntity[]> {
    return this.productsService.getFeaturedProducts();
  }

  // Public endpoint - anyone can access
  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by ID (Public)' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a product',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return {
      ...product,
      variants: product.variants.map((variant) => variant),
    };
  }

  // Protected endpoint - only for sellers
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles([Role.SELLER, Role.ADMIN])
  @ApiBearerAuth('JWT-auth') // Move to protected route
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product Sellers | Admin' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Sellers only',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, req.user.storeId, updateProductDto);
  }

  // Protected endpoint - only for sellers
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([Role.SELLER, Role.ADMIN])
  @ApiBearerAuth('JWT-auth') // Move to protected route
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product Sellers | Admin' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Sellers only',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.productsService.remove(id, req.user.storeId);
  }


  @Patch(':id/mark-featured')
  @Roles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin Mark product featured' })
  async toggleFeaturedStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') adminId: string,
    @Body('isFeatured') isFeatured: boolean,
  ): Promise<ProductEntity> {
    return this.productsService.toggleFeaturedStatus(id, adminId, isFeatured);
  }
}
