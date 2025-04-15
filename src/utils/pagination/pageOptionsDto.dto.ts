import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PageOptionsDto {
  @IsString()
  @IsOptional()
  readonly status?: string = '';

  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly pageLimit?: number = 10;

  constructor() {
    this.order = Order.DESC;
    this.pageLimit = 50;
    this.page = 1;
  }

  get skip(): number {
    const page = this.page ?? 1;
    const pageLimit = this.pageLimit ?? 50;
    return (page - 1) * pageLimit;
  }
}
