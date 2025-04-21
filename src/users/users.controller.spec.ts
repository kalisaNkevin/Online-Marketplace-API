import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role, Gender } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;

  // Mock user with all required properties
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.SHOPPER,
    password: 'hashedPassword123',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    avatar: '',
    dateOfBirth: new Date(),
    gender: Gender.OTHER,
    bio: '',
    isEmailVerified: false,
    isActive: true,
    preferredLanguage: 'en',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockUsersService = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: { id: '1' } };
      mockUsersService.findById.mockResolvedValue(mockUser);
      const result = await controller.getProfile(req);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(req.user.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      const req = { user: { id: '999' } };
      mockUsersService.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.getProfile(req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      const request = { user: { role: Role.ADMIN } };

      const result = await controller.getUserById('1', request);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findById.mockRejectedValue(new NotFoundException());
      const request = { user: { role: Role.ADMIN } };

      await expect(controller.getUserById('999', request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not an admin', async () => {
      const req = { user: { role: Role.SHOPPER } };
      await expect(controller.getUserById('1', req)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
