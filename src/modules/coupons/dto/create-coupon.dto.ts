import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({
    description: 'Código único do cupom',
    example: 'LAPES10',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Tipo de desconto: PERCENT ou FIXED',
    enum: CouponType,
    example: 'PERCENT',
  })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({
    description:
      'Valor do desconto. Para PERCENT, o percentual. Para FIXED, o valor em reais',
    example: 10,
  })
  @IsNumber()
  @Min(0.01)
  @Max(100, { message: 'Para PERCENT, o valor máximo é 100.' })
  value: number;

  @ApiPropertyOptional({
    description: 'Valor mínimo do pedido para aplicação do cupom',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({
    description: 'Data de expiração do cupom',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsDateString()
  expiresAt: string;
}
