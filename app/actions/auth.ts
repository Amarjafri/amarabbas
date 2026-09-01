'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createSessionToken, passwordMatches, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export interface LoginState {
  error?: string
}

/** Throttles brute-force attempts within one server instance. */
const attempts = new Map<string, { count: number; until: number }>()
const MAX_ATTEMPTS = 8
const LOCKOUT_MS = 15 * 60 * 1000

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const { headers } = await import('next/headers')
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  const now = Date.now()
  const record = attempts.get(ip)

  if (record && record.count >= MAX_ATTEMPTS && now < record.until) {
    return { error: 'Too many attempts. Try again in a few minutes.' }
  }

  if (!process.env.ADMIN_PASSWORD) {
    return { error: 'ADMIN_PASSWORD is not configured on the server.' }
  }

  if (!process.env.AUTH_SECRET) {
    return { error: 'AUTH_SECRET is not configured on the server.' }
  }

  const password = String(formData.get('password') ?? '')

  if (!passwordMatches(password)) {
    const count = record && now < record.until ? record.count + 1 : 1
    attempts.set(ip, { count, until: now + LOCKOUT_MS })
    return { error: 'That password is not correct.' }
  }

  attempts.delete(ip)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions)

  redirect('/admin')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/admin/login')
}
