import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { EmailService } from '@/email/email.service';
import { LoginUserDto } from './dto/login.dto';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const emailExists = await this.checkEmailExists(createUserDto.email);
    if (emailExists) {
      throw new BadRequestException(createUserDto.email);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role,
        verificationToken,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // For sellers, check if they have an associated store
    if (user.role === 'SELLER') {
      const store = await this.prisma.store.findFirst({
        where: { ownerId: user.id },
      });

      if (!store) {
        throw new ForbiddenException(
          'Seller must create a store before creating products',
        );
      }

      // Include store information in the payload
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        storeId: store.id, // Add store ID to payload
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '1h',
        }),
        this.jwtService.signAsync(
          { sub: user.id, storeId: store.id }, // Include storeId in refresh token
          {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
          },
        ),
      ]);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return { token: accessToken, refreshToken };
    }

    // For non-sellers, continue with regular payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1h', // Explicit expiration
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: '7d', // Explicit expiration
        },
      ),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { token: accessToken, refreshToken };
  }

  async logout(
    refreshToken: string,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Find user and clear refresh token
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Clear the refresh token
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });

      return {
        statusCode: 200,
        message: 'Logout successful',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process logout request',
      );
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          refreshToken,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRATION'),
        },
      );

      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        },
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
