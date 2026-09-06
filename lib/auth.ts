import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  baseURL: {
    allowedHosts: [
      'localhost:3000',
      'localhost:*',
      '*.vercel.app',
      ...(process.env.BETTER_AUTH_URL ? [new URL(process.env.BETTER_AUTH_URL).host] : []),
    ],
    protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https',
  },
  emailAndPassword: { enabled: true, autoSignIn: true },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})
