'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { login, type LoginState } from '@/app/actions/auth'

/**
 * The Laravel form asked for an email and a password against a users table.
 * There is one operator here, so the port checks a single ADMIN_PASSWORD and
 * drops the email field rather than showing one that is never verified.
 */
export default function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {})

  return (
    <>
      {state.error && (
        <div className="alert alert-error" role="alert">
          <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} id="loginForm">
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <i className="fas fa-lock input-icon" aria-hidden="true"></i>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              autoFocus
              autoComplete="current-password"
            />
          </div>
        </div>

        <SubmitButton />
      </form>
    </>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}
