'use server'

import { Resend } from 'resend'

import { setting } from '@/lib/data'
import { readRows, writeCollection } from '@/lib/store'
import type { Enquiry } from '@/lib/types'

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

/**
 * Append the enquiry to data/enquiries.json.
 *
 * In production a write is a GitHub commit, which is a read-modify-write: two
 * submissions landing together make the second one's sha stale and GitHub
 * answers 409. Re-read and try again rather than dropping the enquiry — the
 * admin panel deliberately does not retry, because there a conflict means the
 * operator's own form data is stale and overwriting would lose someone's edit.
 */
async function storeEnquiry(
  values: Record<string, string>,
  emailed: boolean
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const rows = await readRows<Enquiry>('enquiries')

      const enquiry: Enquiry = {
        id: rows.reduce((max, row) => Math.max(max, row.id), 0) + 1,
        name: values.name,
        email: values.email,
        phone: values.phone,
        project_type: values.project_type,
        message: values.message,
        read: false,
        emailed,
        created_at: new Date().toISOString(),
      }

      await writeCollection('enquiries', [...rows, enquiry], `Enquiry from ${values.name}`)
      return true
    } catch {
      // Fall through and retry; the last failure returns false so the caller
      // can decide whether the visitor still has a route to reach him.
    }
  }

  return false
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

  const emailed = await sendNotification(values)
  const stored = await storeEnquiry(values, emailed)

  // The enquiry is only lost if both routes failed. If either worked he has it,
  // so tell the visitor it arrived rather than sending them away.
  if (!emailed && !stored) {
    return { status: 'error', message: fallbackContactMessage(), values }
  }

  return { status: 'success' }
}

/** Returns whether the notification email actually went out. */
async function sendNotification(values: Record<string, string>): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL || setting('email')

  if (!apiKey || !to) return false

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

    return !error
  } catch {
    return false
  }
}
