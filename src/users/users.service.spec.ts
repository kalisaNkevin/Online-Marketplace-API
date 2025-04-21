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

  describe('findById', () => {

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
        }
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.update.mockRejectedValueOnce(new NotFoundException());
      await expect(service.updateProfile('999', updateDto))
        .rejects.toThrow(NotFoundException);
    });
  });
});