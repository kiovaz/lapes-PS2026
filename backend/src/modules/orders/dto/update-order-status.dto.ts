import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Novo status do pedido',
    enum: ['PAID', 'SHIPPED', 'DELIVERED'],
    example: 'SHIPPED',
  })
  @IsEnum(OrderStatus, {
    message: 'Status deve ser: PAID, SHIPPED ou DELIVERED',
  })
  status: OrderStatus;
}
