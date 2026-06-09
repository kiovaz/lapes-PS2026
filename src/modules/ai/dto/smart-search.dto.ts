import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SmartSearchDto {
  @ApiProperty({
    description: 'Busca em linguagem natural. Ex: "notebook barato até 3000"',
    example: 'camiseta esportiva até 150 reais',
    minLength: 2,
    maxLength: 500,
  })
  @IsString()
  @MinLength(2, { message: 'A busca deve ter no mínimo 2 caracteres.' })
  @MaxLength(500, { message: 'A busca deve ter no máximo 500 caracteres.' })
  query: string;
}
