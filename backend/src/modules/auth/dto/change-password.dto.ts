import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: '123456',
    description: 'Senha atual do usuário',
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty({
    example: '654321',
    description: 'Nova senha de no mínimo 6 caracteres',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  newPassword: string;
}
