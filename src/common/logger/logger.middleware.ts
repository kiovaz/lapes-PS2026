// LOGGER MIDDLEWARE
// timestamp, método, rota, status, duração

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {
    // Marca o início da requisição
    const start = Date.now();

    // qnd a res terminar --> loga
    res.on('finish', () => {
      const duration = Date.now() - start;

      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };

      // loga em formato JSON 
      console.log(JSON.stringify(log));
    });

    // vai pro próximo middleware/rota
    next();
  }
}
