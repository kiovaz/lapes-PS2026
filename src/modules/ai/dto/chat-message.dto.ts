import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ChatHistoryItem {
  @ApiProperty({
    description: 'Papel da mensagem',
    enum: ['user', 'model'],
    example: 'user',
  })
  @IsString()
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Quais categorias vocês têm?',
  })
  @IsString()
  content: string;
}

export class ChatMessageDto {
  @ApiProperty({
    description: 'Mensagem do usuário para o assistente',
    example: 'Tem algum produto de eletrônicos em promoção?',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(1, { message: 'A mensagem não pode estar vazia.' })
  @MaxLength(1000, {
    message: 'A mensagem deve ter no máximo 1000 caracteres.',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Histórico de mensagens anteriores da conversa',
    type: [ChatHistoryItem],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItem)
  history?: ChatHistoryItem[];
}
