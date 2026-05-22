import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiPropertyOptional({
    description: 'Código do cupom de desconto',
    example: 'LAPES10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description:
      'Chave de idempotência — permite retry seguro do checkout. ' +
      'Se já existe um pedido com essa chave, retorna o existente.',
    example: 'checkout-uuid-abc123',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
