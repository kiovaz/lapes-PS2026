// ============================================================
// LOGGER MIDDLEWARE — Loga toda requisição em formato JSON
// Requisito do desafio: timestamp, método, rota, status, duração
// ============================================================

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {
    // Marca o início da requisição
    const start = Date.now();

    // Quando a resposta terminar, loga
    res.on('finish', () => {
      const duration = Date.now() - start;

      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };

      // Loga em formato JSON (requisito do desafio)
      console.log(JSON.stringify(log));
    });

    // Passa pro próximo middleware/rota
    next();
  }
}
