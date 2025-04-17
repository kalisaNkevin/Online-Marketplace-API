import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
  Length,
  Matches,
  MinLength,
  MaxLength,
  IsISO31661Alpha2,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address (must be unique)',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Password (min 6 chars, must include number and special char)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least 1 number and 1 special character',
  })
  password?: string;

  @ApiProperty({
    example: '+250789123456',
    description: 'Phone number in international format',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (e.g., +250789123456)',
  })
  phoneNumber?: string;

  @ApiProperty({
    example: 'KN 20 Ave',
    description: 'Street address',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address?: string;

  @ApiProperty({
    example: 'Kigali',
    description: 'City name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  city?: string;

  @ApiProperty({
    example: 'RW',
    description: 'Country code (ISO 3166-1 alpha-2)',
    required: false,
  })
  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  @ApiProperty({
    example: '00000',
    description: 'Postal/ZIP code',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 10)
  postalCode?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL to profile picture',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+\..+/, {
    message: 'Avatar must be a valid URL',
  })
  avatar?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Date of birth (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({
    example: 'I love technology and innovation',
    description: 'Short bio or description',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiProperty({
    example: 'en',
    description: 'Preferred language code (ISO 639-1)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  preferredLanguage?: string = 'en';
}
