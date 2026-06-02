import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCpfValid } from 'src/common/validators/cpf.validator';

export class RegisterDto {
  @ApiProperty({
    example: 'João',
    description: 'Primeiro nome do usuário',
  })
  @IsString()
  @IsNotEmpty({ message: 'O primeiro nome é obrigatório' })
  @MinLength(2, { message: 'O primeiro nome deve ter pelo menos 2 caracteres' })
  firstName: string;

  @ApiProperty({
    example: 'Silva',
    description: 'Sobrenome do usuário',
  })
  @IsString()
  @IsNotEmpty({ message: 'O sobrenome é obrigatório' })
  @MinLength(2, { message: 'O sobrenome deve ter pelo menos 2 caracteres' })
  lastName: string;

  @ApiProperty({
    example: 'joao@email.com',
    description: 'Email para login',
  })
  @IsEmail({}, { message: 'Informe um email válido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @ApiProperty({
    example: '12345678909',
    description: 'CPF válido com 11 dígitos (somente números)',
  })
  @IsString()
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter exatamente 11 dígitos numéricos' })
  @IsCpfValid({ message: 'CPF inválido. Verifique os dígitos informados.' })
  cpf: string;

  @ApiProperty({
    example: '11999998888',
    description: 'Telefone com DDD (10 ou 11 dígitos, somente números)',
  })
  @IsString()
  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone deve conter 10 ou 11 dígitos numéricos (DDD + número)',
  })
  phone: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Data de nascimento no formato ISO (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'Informe uma data de nascimento válida (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'A data de nascimento é obrigatória' })
  birthDate: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha de no mínimo 6 caracteres',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;
}
