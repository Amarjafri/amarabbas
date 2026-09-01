import { jwtVerify, SignJWT } from 'jose'

/**
 * Admin session: a signed JWT in an httpOnly cookie.
 *
 * Laravel used a users table; the port has a single operator, so the password
 * lives in ADMIN_PASSWORD and the cookie only has to prove "this browser got
 * that password right".
 */

export const SESSION_COOKIE = 'admin_session'
const SESSION_DAYS = 7

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET

  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Generate one with `openssl rand -base64 32`.'
    )
  }

  return new TextEncoder().encode(secret)
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey())
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, secretKey())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

/**
 * Constant-time comparison, so a wrong password cannot be narrowed down by
 * timing how long the check took.
 */
export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''

  if (!expected) return false

  const a = new TextEncoder().encode(candidate)
  const b = new TextEncoder().encode(expected)

  // Fold the length difference into the result rather than returning early.
  let diff = a.length ^ b.length

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }

  return diff === 0
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
}
