import { ApiProperty } from '@nestjs/swagger';
import { OrderEntity } from '../entities/order.entity';

export class PaginatedOrdersResponse {
  @ApiProperty({ type: [OrderEntity] })
  data: OrderEntity[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty()
  filters?: {
    status?: string;
  };
}
