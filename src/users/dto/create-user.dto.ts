import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password - minimum 6 characters',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: Role,
    enumName: 'Role',
    description: 'User role in the system',
    example: Role.SHOPPER,
    examples: {
      SHOPPER: {
        value: Role.SHOPPER,
        summary: 'Regular Customer',
        description: 'Can browse and purchase products',
      },
      SELLER: {
        value: Role.SELLER,
        summary: 'Store Owner',
        description: 'Can list and manage products, track sales',
      },
      ADMIN: {
        value: Role.ADMIN,
        summary: 'Administrator',
        description: 'Full system access and management',
      },
    },
    required: true,
  })
  @IsEnum(Role, {
    message: 'Role must be either SHOPPER, SELLER, or ADMIN',
  })
  @IsNotEmpty({ message: 'Role selection is required' })
  role: Role;
}
