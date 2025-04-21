import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role, Gender } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;

  // Test data
  const mockUserData = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.SHOPPER,
    password: 'hashedPassword123',
    phoneNumber: '1234567890',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    postalCode: '12345',
    avatar: 'avatar.jpg',
    dateOfBirth: new Date(),
    gender: Gender.OTHER,
    bio: 'Test bio',
    isEmailVerified: false,
    isActive: true,
    preferredLanguage: 'en',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    verificationToken: null,
    refreshToken: null,
    resetToken: null,
  };

  const mockAdminRequest = { user: { role: Role.ADMIN, id: '1' } };
  const mockShopperRequest = { user: { role: Role.SHOPPER, id: '2' } };
  const mockUpdateProfileDto: UpdateProfileDto = {
    name: 'Updated Name',
    phoneNumber: '9876543210',
    address: 'New Address',
  };

  beforeEach(async () => {
    mockUsersService = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
      findAll: jest.fn(),
      deactivateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('Profile Operations', () => {
    describe('getProfile', () => {
      it('should return user profile', async () => {
        mockUsersService.findById.mockResolvedValue(mockUserData);
        const result = await controller.getProfile({ user: { id: '1' } });
        expect(result).toEqual(mockUserData);
      });

      it('should throw NotFoundException for invalid user', async () => {
        mockUsersService.findById.mockRejectedValue(new NotFoundException());
        await expect(
          controller.getProfile({ user: { id: '999' } })
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateProfile', () => {
      it('should update profile successfully', async () => {
        const updatedUser = { ...mockUserData, ...mockUpdateProfileDto };
        mockUsersService.updateProfile.mockResolvedValue(updatedUser);
        
        const result = await controller.updateProfile(
          { user: { sub: '1' } },
          mockUpdateProfileDto
        );
        
        expect(result).toEqual(updatedUser);
      });

      it('should handle update failures', async () => {
        mockUsersService.updateProfile.mockRejectedValue(new NotFoundException());
        await expect(
          controller.updateProfile({ user: { sub: '999' } }, mockUpdateProfileDto)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Admin Operations', () => {
    describe('getAllUsers', () => {
      it('should allow admin access', async () => {
        const users = [mockUserData, { ...mockUserData, id: '2' }];
        mockUsersService.findAll.mockResolvedValue(users);
        
        const result = await controller.getAllUsers(mockAdminRequest);
        expect(result).toEqual(users);
      });

      it('should forbid non-admin access', async () => {
        await expect(
          controller.getAllUsers(mockShopperRequest)
        ).rejects.toThrow(ForbiddenException);
        expect(mockUsersService.findAll).not.toHaveBeenCalled();
      });
    });

    describe('deactivateUser', () => {
      it('should allow admin to deactivate users', async () => {
        const deactivatedUser = { ...mockUserData, isActive: false };
        mockUsersService.deactivateUser.mockResolvedValue(deactivatedUser);
        
        const result = await controller.deactivateUser('2', mockAdminRequest);
        expect(result).toEqual(deactivatedUser);
      });

      it('should prevent non-admin deactivation', async () => {
        await expect(
          controller.deactivateUser('1', mockShopperRequest)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('deleteUser', () => {
      it('should allow admin to delete other users', async () => {
        mockUsersService.deleteUser.mockResolvedValue(mockUserData);
        
        const result = await controller.deleteUser('2', mockAdminRequest);
        expect(result).toEqual(mockUserData);
      });

      it('should prevent self-deletion', async () => {
        const adminUserRequest = { 
          user: { 
            id: '1',    // Same ID as the one being deleted
            role: Role.ADMIN 
          } 
        };
        
        await expect(
          controller.deleteUser('1', adminUserRequest)
        ).rejects.toThrow(ForbiddenException);
        
        expect(mockUsersService.deleteUser).not.toHaveBeenCalled();
      });

      it('should handle non-existent users', async () => {
        mockUsersService.deleteUser.mockRejectedValue(new NotFoundException());
        await expect(
          controller.deleteUser('999', mockAdminRequest)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
