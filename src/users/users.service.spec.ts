import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { Role, Gender } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

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

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if id is empty', async () => {
      await expect(service.findById('')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        role: Role.SELLER,
      };

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      mockPrismaService.user.create.mockResolvedValue({
        ...createUserDto,
        id: '2',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createUserDto);
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.name).toBe(createUserDto.name);
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      name: 'Updated Name',
      phoneNumber: '1234567890',
    };

    it('should update and return the user profile', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockPrismaService.user.update.mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfile('1', updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.update.mockRejectedValueOnce(
        new NotFoundException(),
      );
      await expect(service.updateProfile('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token', async () => {
      const updatedUser = { ...mockUser, refreshToken: 'new-token' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateRefreshToken('1', 'new-token');
      expect(result.refreshToken).toBe('new-token');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshToken: 'new-token' },
      });
    });

    it('should set refresh token to null', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });
      const result = await service.updateRefreshToken('1', null);
      expect(result.refreshToken).toBeNull();
    });
  });

  describe('updateResetToken', () => {
    it('should update reset token', async () => {
      const updatedUser = { ...mockUser, resetToken: 'reset-token' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateResetToken('1', 'reset-token');
      expect(result.resetToken).toBe('reset-token');
    });

    it('should clear reset token', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        resetToken: null,
      });
      const result = await service.updateResetToken('1', null);
      expect(result.resetToken).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const hashedPassword = await bcrypt.hash('newpassword', 10);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.updatePassword('1', hashedPassword);
      expect(result.password).toBe(hashedPassword);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { password: hashedPassword },
      });
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: '2', email: 'test2@example.com' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockPrismaService.user.update.mockResolvedValue(deactivatedUser);

      const result = await service.deactivateUser('1');
      expect(result.isActive).toBe(false);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser('1');
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrismaService.user.delete.mockRejectedValue(
        new Error('User not found'),
      );
      await expect(service.deleteUser('999')).rejects.toThrow('User not found');
    });
  });
});
