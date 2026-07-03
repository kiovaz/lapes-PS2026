import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Camiseta Básica' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'O nome do produto deve conter pelo menos 2 caracteres',
  })
  name: string;

  @ApiProperty({ example: 'Camiseta 100% algodão, confortável e estilosa.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 59.9 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'Roupas' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 'https://exemplo.com/imagem.png' })
  @IsOptional()
  @IsUrl()
  image?: string;
}
