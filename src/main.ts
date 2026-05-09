// ============================================================
// MAIN.TS — Ponto de entrada da aplicação
// ============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === VALIDAÇÃO GLOBAL (Pipe) ===
  // Ativa a verificação automática dos DTOs em toda a API
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // remove campos que não estão no DTO
      forbidNonWhitelisted: true, // retorna erro se mandar campo extra
      transform: true,            // converte tipos automaticamente (ex: string "5" → number 5)
    }),
  );

  // === SWAGGER (Documentação da API) ===
  const config = new DocumentBuilder()
    .setTitle('E-commerce LAPES')
    .setDescription('API do E-commerce Simplificado — Desafio LAPES 2026')
    .setVersion('1.0')
    .addBearerAuth()              // adiciona botão de login no Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  // Swagger fica disponível em: http://localhost:3000/docs

  // === CORS ===
  app.enableCors();

  // === START ===
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log('');
  console.log('🚀 API rodando em: http://localhost:' + port);
  console.log('📚 Swagger em:     http://localhost:' + port + '/docs');
  console.log('');
}
bootstrap();
