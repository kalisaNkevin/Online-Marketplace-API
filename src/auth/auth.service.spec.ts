import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  // Add mock for MailService
  const mockMailService = {
    sendUserConfirmation: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    store: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'JWT_SECRET':
                  return 'test-secret';
                case 'JWT_REFRESH_SECRET':
                  return 'test-refresh-secret';
                case 'JWT_EXPIRATION':
                  return '3600';
                case 'JWT_REFRESH_EXPIRATION':
                  return '604800';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      role: Role.SHOPPER,
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValueOnce({
        id: '1',
        ...registerDto,
        password: hashedPassword,
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        role: registerDto.role,
      });
    });

    it('should throw DuplicateEmailException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: '1' });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: '1' });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: false,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should login successfully and return tokens', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        ...user,
        stores: [],
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should login successfully and return tokens with user', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('refreshToken', () => {
    const oldRefreshToken = 'valid-refresh-token';
    const userId = '1';
    const userEmail = 'test@example.com';

    it('should refresh tokens successfully', async () => {
      // Mock JWT verification with proper secret
      mockJwtService.verifyAsync.mockImplementationOnce(
        async (token, options) => {
          if (
            token === oldRefreshToken &&
            options.secret === 'test-refresh-secret'
          ) {
            return { sub: userId, email: userEmail };
          }
          throw new Error('Invalid token');
        },
      );

      // Mock finding user with matching refresh token
      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: userId,
        email: userEmail,
        refreshToken: oldRefreshToken,
        role: Role.SHOPPER,
      });

      // Mock token generation
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token') // Access token
        .mockResolvedValueOnce('new-refresh-token'); // Refresh token

      // Mock updating user's refresh token
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: userId,
        email: userEmail,
        refreshToken: 'new-refresh-token',
        role: Role.SHOPPER,
      });

      const result = await service.refreshToken(oldRefreshToken);

      expect(result).toEqual({
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Verify JWT operations
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(oldRefreshToken, {
        secret: 'test-refresh-secret',
      });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId, email: userEmail },
        { secret: 'test-secret', expiresIn: '3600' },
      );

      // Verify database update
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: 'new-refresh-token' },
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('Invalid token'),
      );

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
        secret: 'test-refresh-secret',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: userId,
        email: userEmail,
      });

      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.refreshToken(oldRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // Add new test for email sending during registration
  describe('register with email', () => {
    it('should send welcome email on successful registration', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        role: Role.SHOPPER,
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = {
        id: '1',
        ...registerDto,
        password: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValueOnce(user);

      await service.register(registerDto);

      expect(mockMailService.sendUserConfirmation).toHaveBeenCalledWith(
        user,
        expect.any(String), // verification token
      );
    });
  });
});
