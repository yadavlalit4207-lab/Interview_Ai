import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Server Error]', err)

  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  })
}
