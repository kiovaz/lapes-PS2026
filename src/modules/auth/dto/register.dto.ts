import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'Edgar Klewert', description: 'Nome completo do usuário' })
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
    name: string;

    @ApiProperty({ example: 'edgarklewert@email.com', description: 'Email para login' })
    @IsEmail({}, { message: 'Informe um email válido' })
    @IsNotEmpty({ message: 'O email é obrigatório' })
    email: string;

    @ApiProperty({ example: '123456', description: 'Senha de no mínimo 6 caracteres', minLength: 6 })
    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória' })
    @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
    password: string;
}