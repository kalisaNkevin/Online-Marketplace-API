import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'User password - minimum 6 characters',
    required: false,
    minLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
