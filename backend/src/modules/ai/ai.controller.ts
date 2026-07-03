import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AiService } from './ai.service';
import { SmartSearchDto } from './dto/smart-search.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // (público)

  @Post('search')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({
    summary: 'Busca inteligente com linguagem natural',
    description:
      'Recebe uma busca em linguagem natural (ex: "notebook até 3000 reais") ' +
      'e usa IA para extrair filtros e retornar produtos relevantes do catálogo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos retornados com filtros interpretados pela IA.',
  })
  @ApiResponse({
    status: 400,
    description: 'Busca inválida ou serviço de IA indisponível.',
  })
  smartSearch(@Body() dto: SmartSearchDto) {
    return this.aiService.smartSearch(dto.query);
  }

  // (autenticado)

  @Post('chat')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Assistente de compras com IA',
    description:
      'Chat com o assistente virtual da loja. Pode consultar produtos, ' +
      'pedidos, carrinho e cupons do usuário em tempo real via function calling.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resposta do assistente com possíveis dados contextuais.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token ausente ou inválido.',
  })
  chat(@Request() req: any, @Body() dto: ChatMessageDto) {
    return this.aiService.chat(req.user.sub, dto.message, dto.history);
  }
}
