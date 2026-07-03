import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'ID do produto a ser adicionado', example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({ description: 'Quantidade desejada', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
