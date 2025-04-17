import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({
    example: 'Tech Haven',
    description: 'Store name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Your one-stop shop for all tech needs',
    description: 'Store description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
