'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { sendContactMessage, type ContactState } from '@/app/actions/contact'

/**
 * Ported from the contact block in home/index.blade.php. Same fields, same
 * classes, same success/error markup; the POST goes to a Server Action instead
 * of ContactController@send.
 */
export default function ContactForm({
  projectTypes,
  successMessage,
  submitLabel,
}: {
  projectTypes: string[]
  successMessage: string
  submitLabel: string
}) {
  const [state, formAction] = useActionState<ContactState, FormData>(sendContactMessage, {
    status: 'idle',
  })

  const values = state.values ?? {}
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="contact-form" id="contactForm">
      {state.status === 'success' && (
        <div className="form-success" role="status">
          <i className="fas fa-check" aria-hidden="true"></i>
          {successMessage}
        </div>
      )}

      {state.status === 'error' && state.message && (
        <div className="form-error" role="alert">
          {state.message}
        </div>
      )}

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label htmlFor="cf-website">Leave this empty</label>
        <input type="text" id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form-row">
        <label htmlFor="cf-name">Full Name *</label>
        <input
          type="text"
          id="cf-name"
          name="name"
          placeholder="John Smith"
          required
          defaultValue={values.name ?? ''}
          {...(errors.name ? { 'aria-invalid': true } : {})}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-row-2">
        <div className="form-row">
          <label htmlFor="cf-email">Email *</label>
          <input
            type="email"
            id="cf-email"
            name="email"
            placeholder="john@company.com"
            required
            defaultValue={values.email ?? ''}
            {...(errors.email ? { 'aria-invalid': true } : {})}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-row">
          <label htmlFor="cf-phone">Phone</label>
          <input
            type="tel"
            id="cf-phone"
            name="phone"
            placeholder="+1 234 567 890"
            defaultValue={values.phone ?? ''}
          />
        </div>
      </div>

      {projectTypes.length > 0 && (
        <div className="form-row">
          <label htmlFor="cf-type">Project Type</label>
          <select id="cf-type" name="project_type" defaultValue={values.project_type ?? ''}>
            <option value="">Select project type</option>
            {projectTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-row">
        <label htmlFor="cf-message">Message *</label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          placeholder="Tell me about your project, timeline and budget…"
          required
          defaultValue={values.message ?? ''}
          {...(errors.message ? { 'aria-invalid': true } : {})}
        />
        {errors.message && <span className="form-error">{errors.message}</span>}
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  )
}

/** initContactForm() from app.js: disable and swap the label while in flight. */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className="btn-primary form-btn" disabled={pending}>
      {pending ? 'Sending…' : label}
    </button>
  )
}
