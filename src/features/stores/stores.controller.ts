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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guards';
import { Role } from '@prisma/client';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Stores')
@Controller('stores')
@ApiBearerAuth('JWT-auth')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: 201,
    description: 'Store has been successfully created',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Sellers only' })
  async create(@Request() req, @Body() createStoreDto: CreateStoreDto) {
    if (req.user.role !== Role.SELLER) {
      throw new ForbiddenException('Only sellers can create stores');
    }
    return await this.storesService.create(req.user.sub, createStoreDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all stores' })
  @ApiResponse({
    status: 200,
    description: 'Returns all stores with basic information',
  })
  async findAll() {
    return await this.storesService.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  @Get('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user's store" })
  @ApiResponse({
    status: 200,
    description: 'Returns the stores owned by the current user',
  })
  async findMyStore(@Request() req) {
    return await this.storesService.findByUser(req.user.sub, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a store with detailed information',
  })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('id') id: string) {
    return await this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update store' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'Store has been successfully updated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not store owner' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return await this.storesService.update(id, req.user.sub, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete store' })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'Store has been successfully deleted',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not store owner' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return await this.storesService.remove(id, req.user.sub);
  }
}
