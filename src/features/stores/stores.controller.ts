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
  UnauthorizedException,
  HttpStatus,
  NotFoundException,
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
import { Role, Store } from '@prisma/client';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { StoreResponseDto } from './dto/store-response.dto';

@ApiTags('Stores')
@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles([Role.SELLER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Store has been successfully created',
    type: CreateStoreDto,
  })
  async create(
    @Request() req,
    @Body() createStoreDto: CreateStoreDto,
  ): Promise<Store> {
    if (req.user.role !== Role.SELLER) {
      throw new ForbiddenException('Only sellers can create stores');
    }
    return this.storesService.create(req.user.id, createStoreDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all stores (Public)' })
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
  @Roles([Role.SELLER])
  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get seller's own store" })
  async findMyStore(@Request() req): Promise<StoreResponseDto> {
    const stores = await this.storesService.findByOwnerId(req.user.id);
    if (!stores || stores.length === 0) {
      throw new NotFoundException('Store not found');
    }
    return stores[0];
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get store by ID (Public)' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update store (Private)' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete store (Private)' })
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
