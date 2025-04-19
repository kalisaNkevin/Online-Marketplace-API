// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Create a new user and hash the password before saving
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
      },
    });
    return user;
  }

  // Find a user by their email address
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  // Find a user by their unique ID
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
        preferredLanguage: true,
        isEmailVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateData: UpdateProfileDto) {
    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: refreshToken || null,
      },
    });
  }

  async updateResetToken(userId: string, resetToken: string | null) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: resetToken || null,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
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
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    if (updateProfileDto.password) {
      const salt = await bcrypt.genSalt();
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        salt,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
