import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from '../config'

export interface UserTokenPayload {
  id: string
  email: string
  display_name: string
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  },

  generateToken(payload: UserTokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    })
  },

  verifyToken(token: string): UserTokenPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as UserTokenPayload
    } catch {
      return null
    }
  },

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex')
  },
}
