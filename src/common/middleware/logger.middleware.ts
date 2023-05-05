import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { jwtKey } from 'src/utils/constant';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'GET') {
      const credential = req.cookies[jwtKey]
        ? req.cookies[jwtKey]
        : req.headers.authorization;
      const dateNow = new Date().toDateString();
      console.log(`[${req.method}] - ${dateNow} - ${req.originalUrl}`);
      console.log(`________BY: ${credential}`);
      console.log('----------------------------------------------------------');
    }
    next();
  }
}
