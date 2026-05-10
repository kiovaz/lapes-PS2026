// HTTP EXCEPTION FILTER — Padroniza respostas de erro
// res  padronizadas, sem st  exposta

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

    // if HttpException NestJS, pega o status
    // else if é erro interno (500)
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // mensagem do erro (string ou objeto)
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exceptionResponse;
    }

    // log  erro no servidor (debug)
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      error: exception instanceof Error ? exception.message : 'Unknown error',
    }));

    // res padronizada
    // SEM stack trace
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
