import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto } from 'src/features/products/dto/create-product.dto';


export class OrderItemEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: string;

  @ApiProperty()
  total: string;

  @ApiProperty({ required: false })
  size?: string;

  @ApiProperty({ type: () => CreateProductDto })
  product: {
    id: string;
    name: string;
    price: number;
    storeId: string;
  };
}