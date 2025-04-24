import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({
    example: 'Tech Haven',
    description: 'Store name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Your one-stop shop for all tech needs',
    description: 'Store description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'Store logo URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
