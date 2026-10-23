import { Request, Response, NextFunction } from 'express'

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup expired records every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${ip}:${req.baseUrl || req.path}`
    const now = Date.now()

    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      next()
      return
    }

    record.count += 1
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      res.setHeader('Retry-After', retryAfter)
      res.status(429).json({ error: message, retryAfterSeconds: retryAfter })
      return
    }

    next()
  }
}
