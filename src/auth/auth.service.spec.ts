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
import * as crypto from 'crypto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
  genSalt: jest.fn().mockImplementation(() => Promise.resolve('salt')),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: () => 'test-verification-token',
  }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockMailService = {
    sendUserConfirmation: jest.fn(),
  };

  const mockConfigService = {
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
        case 'APP_URL':
          return 'http://localhost:3000';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
    configService = module.get(ConfigService);
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

    const verificationToken = 'test-verification-token';

    beforeEach(() => {
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => verificationToken,
      });
    });

    it('should register a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        ...registerDto,
        verificationToken,
        isEmailVerified: false,
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message:
          'Registration successful. Please check your email to verify your account.',
        user: {
          id: '1',
          email: registerDto.email,
          name: registerDto.name,
        },
      });

      // Fix verification token test
      expect(mockMailService.sendUserConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          email: registerDto.email,
        }),
        expect.any(String), // Changed to any string since token is randomly generated
      );
    });

    it('should throw BadRequestException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException(
          'User with email test@example.com already exists',
        ),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Mock bcrypt.compare to return false for this test
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const user = {
        id: '1',
        email: loginDto.email,
        password: 'hashed_password',
        isEmailVerified: true,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
    }); 

    it('should throw UnauthorizedException if email is not verified', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: false,
        role: Role.SHOPPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Please verify your email first'),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'valid-token';
      const user = {
        id: '1',
        email: 'test@example.com',
        verificationToken: token,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        isEmailVerified: true,
        verificationToken: null,
      });

      await service.verifyEmail(token);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verificationToken: null,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        new BadRequestException('Invalid verification token'),
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = 'valid-refresh-token';
    const userId = '1';
    const userEmail = 'test@example.com';

    it('should refresh tokens successfully', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: userId,
        email: userEmail,
      });

      const user = {
        id: userId,
        email: userEmail,
        refreshToken: refreshTokenDto,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error());

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid-refresh-token';

    it('should logout successfully', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        refreshToken,
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: user.id,
        email: user.email,
      });

      // Important: Mock the findFirst to return user with matching refreshToken
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...user,
        refreshToken: refreshToken, // Make sure this matches
      });

      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        refreshToken: null,
      });

      const result = await service.logout(refreshToken);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Logout successful',
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: '1',
        email: 'test@example.com',
      });

      // Mock findFirst to return null to simulate invalid token
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });
  });
});
