// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { EmailService } from 'src/email/email.service';
import { LoginUserDto } from './dto/login.dto';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return user;
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
      refreshToken: await this.jwtService.signAsync(
        { sub: user.id },
        { expiresIn: '7d' },
      ),
    };
  }

  async getProfile(userId: string) {
    return await this.usersService.findById(userId);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    if (updateProfileDto.password) {
      const salt = await bcrypt.genSalt();
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        salt,
      );
    }

    const updatedUser = await this.usersService.update(
      userId,
      updateProfileDto,
    );
    delete updatedUser.password;
    return updatedUser;
  }

  async logout(userId: string) {
    // Invalidate refresh token
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logout successful' };
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    return !!user;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '1h' }
    );

    await this.usersService.updateResetToken(user.id, resetToken);
    await this.emailService.sendPasswordReset(email, resetToken);

    return {
      message: 'Password reset instructions sent successfully'
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { userId, token, newPassword, confirmPassword } = resetPasswordDto;

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Lock the user record for update
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            password: true,
            resetToken: true
          }
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // 2. Verify token and update password
        if (!user.resetToken || user.resetToken !== token) {
          throw new BadRequestException('Invalid or expired reset token');
        }

        // 3. Hash and update password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update user record
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            resetToken: null,
            updatedAt: new Date()
          }
        });

        // 5. Send confirmation email
        await this.emailService.sendPasswordChangeConfirmation(user.email);

        return {
          message: 'Password reset successful',
          timestamp: new Date().toISOString()
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Password reset failed. Please try again.');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      });
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        { expiresIn: '7d' },
      );

      // Update refresh token in database
      await this.usersService.updateRefreshToken(user.id, newRefreshToken);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
