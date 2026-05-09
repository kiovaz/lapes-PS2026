// ============================================================
// HTTP EXCEPTION FILTER — Padroniza respostas de erro
// Requisito: respostas padronizadas, sem stack traces expostos
// ============================================================

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Se for um HttpException do NestJS, pega o status
    // Senão, é erro interno (500)
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Pega a mensagem do erro (pode ser string ou objeto)
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exceptionResponse;
    }

    // Loga o erro no servidor (pra debug)
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      error: exception instanceof Error ? exception.message : 'Unknown error',
    }));

    // Retorna resposta padronizada pro cliente
    // SEM stack trace (requisito do desafio)
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
