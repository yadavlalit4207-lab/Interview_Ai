import { Request, Response, NextFunction } from 'express'
import { authService, UserTokenPayload } from '../services/auth.service'
import { db } from '../db'

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or malformed token.' })
    return
  }

  const token = authHeader.split(' ')[1]
  const decoded = authService.verifyToken(token)

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' })
    return
  }

  // Ensure user still exists in database
  const userStmt = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?')
  const user = userStmt.get(decoded.id) as { id: string; email: string; display_name: string } | undefined

  if (!user) {
    res.status(401).json({ error: 'User account associated with this token no longer exists.' })
    return
  }

  req.user = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
  }

  next()
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const decoded = authService.verifyToken(token)
    if (decoded) {
      const userStmt = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?')
      const user = userStmt.get(decoded.id) as { id: string; email: string; display_name: string } | undefined
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
        }
      }
    }
  }
  next()
}
