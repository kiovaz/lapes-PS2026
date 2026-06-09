import { IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'João',
    description: 'Primeiro nome do usuário',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O primeiro nome deve ter pelo menos 2 caracteres' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Silva',
    description: 'Sobrenome do usuário',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O sobrenome deve ter pelo menos 2 caracteres' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '11999998888',
    description: 'Telefone com DDD (10 ou 11 dígitos, somente números)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone deve conter 10 ou 11 dígitos numéricos (DDD + número)',
  })
  phone?: string;
}
