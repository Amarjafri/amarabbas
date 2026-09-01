'use server'

import { Resend } from 'resend'

import { setting } from '@/lib/data'

export interface ContactState {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<'name' | 'email' | 'phone' | 'project_type' | 'message', string>>
  values?: Record<string, string>
}

/**
 * Best-effort per-IP throttle. Serverless instances do not share memory, so a
 * determined flooder hitting cold lambdas can slip past — it is here to stop
 * accidental double-submits and casual abuse, with the honeypot doing the rest.
 */
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT.windowMs)

  if (recent.length >= RATE_LIMIT.max) {
    hits.set(ip, recent)
    return true
  }

  recent.push(now)
  hits.set(ip, recent)

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [key, stamps] of hits) {
      if (!stamps.some((at) => now - at < RATE_LIMIT.windowMs)) hits.delete(key)
    }
  }

  return false
}

/** Mirrors ContactController@send's validate() rules, message for message. */
function validate(values: Record<string, string>): ContactState['errors'] {
  const errors: NonNullable<ContactState['errors']> = {}

  if (!values.name) errors.name = 'The name field is required.'
  else if (values.name.length > 100) errors.name = 'The name may not be greater than 100 characters.'

  if (!values.email) errors.email = 'The email field is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = 'The email must be a valid email address.'
  else if (values.email.length > 150)
    errors.email = 'The email may not be greater than 150 characters.'

  if (values.phone && values.phone.length > 30)
    errors.phone = 'The phone may not be greater than 30 characters.'

  if (values.project_type && values.project_type.length > 100)
    errors.project_type = 'The project type may not be greater than 100 characters.'

  if (!values.message) errors.message = 'The message field is required.'
  else if (values.message.length < 10)
    errors.message = 'The message must be at least 10 characters.'
  else if (values.message.length > 2000)
    errors.message = 'The message may not be greater than 2000 characters.'

  return Object.keys(errors).length ? errors : undefined
}

/** Fallback copy when email is not configured — never a 500, always a way through. */
function fallbackContactMessage(): string {
  const email = setting('email')
  const whatsapp = setting('whatsapp')
  const parts = ['Email delivery is not configured right now.']

  if (email) parts.push(`Please email ${email} directly`)
  if (whatsapp) parts.push(`or message on WhatsApp at +${whatsapp}`)

  return parts.join(' ') + '.'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendContactMessage(
  _previous: ContactState,
  formData: FormData
): Promise<ContactState> {
  const values = {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    project_type: String(formData.get('project_type') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  }

  // Honeypot: a real visitor never sees this field, so anything in it is a bot.
  // Answer with the success state so the bot has nothing to learn.
  if (String(formData.get('website') ?? '').trim() !== '') {
    return { status: 'success' }
  }

  const errors = validate(values)
  if (errors) {
    return { status: 'error', errors, values }
  }

  const { headers } = await import('next/headers')
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  if (rateLimited(ip)) {
    return {
      status: 'error',
      message: 'Too many messages sent from this connection. Please try again later.',
      values,
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL || setting('email')

  if (!apiKey || !to) {
    return { status: 'error', message: fallbackContactMessage(), values }
  }

  try {
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      // Resend's shared sender works without a verified domain; swap it for
      // your own once the domain is verified in the Resend dashboard.
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [to],
      replyTo: values.email,
      subject: `New enquiry from ${values.name}`,
      html: `
        <h2>New portfolio enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(values.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(values.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(values.phone) || '—'}</p>
        <p><strong>Project type:</strong> ${escapeHtml(values.project_type) || '—'}</p>
        <hr>
        <p>${escapeHtml(values.message).replace(/\n/g, '<br>')}</p>
      `,
    })

    if (error) {
      return { status: 'error', message: fallbackContactMessage(), values }
    }

    return { status: 'success' }
  } catch {
    return { status: 'error', message: fallbackContactMessage(), values }
  }
}
