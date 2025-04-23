import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(
      AuthService,
    ) as jest.Mocked<AuthService>;
    configService = module.get<ConfigService>(
      ConfigService,
    ) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      role: Role.SHOPPER,
    };

    it('should register a new user successfully', async () => {
      const mockResponse = {
        message: 'Registration successful',
        user: {
          id: '1',
          email: createUserDto.email,
          name: createUserDto.name,
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual({
        statusCode: 201,
        message: mockResponse.message,
        data: {
          userId: mockResponse.user.id,
          email: mockResponse.user.email,
        },
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle registration failure', async () => {
      mockAuthService.register.mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(controller.register(createUserDto)).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      const mockResponse = {
        token: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Login successful',
        data: {
          accessToken: mockResponse.token,
          refreshToken: mockResponse.refreshToken,
        },
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login failure', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      const mockResponse = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
    });

    it('should handle refresh token failure', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    const logoutDto: LogoutDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should logout successfully', async () => {
      const mockResponse = {
        statusCode: 200,
        message: 'Logout successful',
      };

      mockAuthService.logout.mockResolvedValue(mockResponse);

      const result = await controller.logout(logoutDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith(
        logoutDto.refreshToken,
      );
    });

    it('should handle logout failure', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(controller.logout(logoutDto)).rejects.toThrow(
        'Logout failed',
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'valid-token';
      mockAuthService.verifyEmail.mockResolvedValue(undefined);

      const result = await controller.verifyEmail(token);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Email verified successfully. You can now log in.',
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should handle email verification failure', async () => {
      const token = 'invalid-token';
      mockAuthService.verifyEmail.mockRejectedValue(
        new Error('Verification failed'),
      );

      await expect(controller.verifyEmail(token)).rejects.toThrow(
        'Verification failed',
      );
    });
  });
});
