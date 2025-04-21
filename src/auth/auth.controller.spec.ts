import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EmailService } from '@/email/email.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  };
  const MockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
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
          provide: EmailService,
          useValue: MockEmailService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
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
      const serviceResponse = {
        id: '1',
        email: 'test@example.com',
        role: Role.SHOPPER,
        name: 'Test User',
      };

      mockAuthService.register.mockResolvedValueOnce(serviceResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual({
        statusCode: 201,
        message: 'User registration successful',
        data: {
          userId: serviceResponse.id,
          email: serviceResponse.email,
          role: serviceResponse.role,
        },
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      const expectedResponse = {
        token: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValueOnce(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Login successful',
        data: {
          accessToken: expectedResponse.token,
          refreshToken: expectedResponse.refreshToken,
        },
      });
    });

    it('should handle login failure', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
