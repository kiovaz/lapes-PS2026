import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({
    description: 'Código do cupom a validar',
    example: 'LAPES10',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Subtotal atual do carrinho',
    example: 150.0,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;
}
