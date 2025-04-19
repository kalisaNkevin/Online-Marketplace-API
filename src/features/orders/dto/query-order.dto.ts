import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class QueryOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
