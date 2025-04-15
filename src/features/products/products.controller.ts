import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guards';
import { SellerGuard } from 'src/auth/guards/seller.guard';

@ApiTags('Products')
@Controller('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SellerGuard)
  @ApiOperation({ summary: 'Create a new product (Sellers only)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Sellers only' })
  async create(@Request() req, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto, req.user.storeId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated products' })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Returns a product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @ApiOperation({ summary: 'Update product (Sellers only)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Sellers only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Request() req,
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.update(id, updateProductDto, req.user.storeId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @ApiOperation({ summary: 'Delete product (Sellers only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Sellers only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.productsService.remove(id, req.user.storeId);
  }
}
