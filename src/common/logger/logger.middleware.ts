import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;

      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };
      console.log(JSON.stringify(log));
    });
    next();
  }
}
