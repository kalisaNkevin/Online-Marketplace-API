import {
  Controller,
  Get,
  Put,
  Delete,
  UseGuards,
  Patch,
  Request,
  ForbiddenException,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { Role } from '@prisma/client';
import { UserProfileEntity } from 'src/users/entities/user-profile.entity';
import { AdminGuard } from '@/auth/guards/admin.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // User Profile Routes
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile data',
    type: UserProfileEntity,
  })
  async getProfile(@Request() req): Promise<UserProfileEntity> {
    const user = await this.usersService.findById(req.user.id);
    const {
      ...profile
    } = user;
    return profile;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
  }

  // Admin Routes
  @Get('admin/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAllUsers(@Request() req) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.findAll();
  }

  @Get('admin/users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getUserById(@Param('id') id: string, @Request() req) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.findById(id);
  }

  @Patch('admin/users/:id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to deactivate' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async deactivateUser(@Param('id') id: string, @Request() req) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.deactivateUser(id);
  }

  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to delete' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async deleteUser(@Param('id') id: string, @Request() req) {
    // Prevent admin from deleting their own account
    if (req.user.id === id) {
      throw new ForbiddenException('Admins cannot delete their own account');
    }
    return this.usersService.deleteUser(id);
  }
}
