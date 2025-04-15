import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class QueryCategoryDto {
  @ApiProperty({
    required: false,
    description: 'Search categories by name or description'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: SortOrder,
    default: 'desc',
    description: 'Sort order direction'
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
