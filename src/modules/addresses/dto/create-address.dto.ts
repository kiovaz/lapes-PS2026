import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({
    example: 'Casa',
    description: 'Rótulo do endereço (Casa, Trabalho, etc.)',
    default: 'Casa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'O rótulo deve ter no máximo 30 caracteres' })
  label?: string;

  @ApiProperty({
    example: 'Rua das Flores, 123',
    description: 'Logradouro com número',
  })
  @IsString()
  @IsNotEmpty({ message: 'O logradouro é obrigatório' })
  @MaxLength(200, { message: 'O logradouro deve ter no máximo 200 caracteres' })
  street: string;

  @ApiPropertyOptional({
    example: 'Apto 42, Bloco B',
    description: 'Complemento (apartamento, bloco, etc.)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'O complemento deve ter no máximo 100 caracteres' })
  complement?: string;

  @ApiProperty({
    example: 'Centro',
    description: 'Bairro',
  })
  @IsString()
  @IsNotEmpty({ message: 'O bairro é obrigatório' })
  @MaxLength(100, { message: 'O bairro deve ter no máximo 100 caracteres' })
  neighborhood: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Cidade',
  })
  @IsString()
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres' })
  city: string;

  @ApiProperty({
    example: 'SP',
    description: 'Unidade Federativa (UF) — 2 letras maiúsculas',
  })
  @IsString()
  @IsNotEmpty({ message: 'O estado é obrigatório' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'O estado deve ser uma UF válida com 2 letras maiúsculas (ex: SP, RJ, MG)',
  })
  state: string;

  @ApiProperty({
    example: '01001000',
    description: 'CEP com 8 dígitos (somente números)',
  })
  @IsString()
  @IsNotEmpty({ message: 'O CEP é obrigatório' })
  @Matches(/^\d{8}$/, {
    message: 'O CEP deve conter exatamente 8 dígitos numéricos',
  })
  zipCode: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Define como endereço padrão',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault deve ser um booleano' })
  isDefault?: boolean;
}
