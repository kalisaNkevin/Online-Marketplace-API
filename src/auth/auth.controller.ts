import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from './decorators/public.decorator';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with the provided details and selected role',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 201,
        },
        message: {
          type: 'string',
          example: 'User registration successful',
        },
        data: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            role: {
              type: 'string',
              example: 'SHOPPER',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or missing role',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 409,
        },
        message: {
          type: 'string',
          example: 'User with email user@example.com already exists',
        },
        error: {
          type: 'string',
          example: 'Conflict',
        },
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return {
      statusCode: 201,
      message: 'User registration successful',
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user',
    description:
      'Login with email and password to receive access and refresh tokens',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(@Body() loginUserDto: LoginUserDto) {
    const result = await this.authService.login(loginUserDto);
    return {
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: result.token, // Rename token to accessToken
        refreshToken: result.refreshToken,
      },
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New tokens generated successfully',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'New JWT access token',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'New JWT refresh token',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate refresh token and clear user session',
  })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  async logout(@Body() logoutDto: LogoutDto) {
    return await this.authService.logout(logoutDto.refreshToken);
  }
}
