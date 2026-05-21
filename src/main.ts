import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import Commander from 'ioredis/built/utils/Commander';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('E-commerce LAPES')
    .setDescription('API do E-commerce Simplificado — Desafio LAPES 2026')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log('');
  console.log('🚀 API rodando em: http://localhost:' + port);
  console.log('📚 Swagger em:     http://localhost:' + port + '/docs');
  console.log('🎨 Prisma Studio em:   http://localhost:5555');
  console.log('📊 Redis Commander em: http://localhost:8081');
  console.log('');
}
bootstrap();
