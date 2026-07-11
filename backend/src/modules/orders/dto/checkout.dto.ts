import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiPropertyOptional({
    description: 'Código do cupom de desconto',
    example: 'CUPOM10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description:
      'ID do endereço de entrega. Se não informado, usa o endereço padrão do usuário.',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'O addressId deve ser um número inteiro' })
  addressId?: number;

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
