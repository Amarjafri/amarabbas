'use client'

import type { ActionState } from '@/app/actions/admin'

/** The session flash / validation alerts from layouts/admin.blade.php. */
export default function AdminFormStatus({ state }: { state: ActionState }) {
  if (state.status === 'success' && state.message) {
    return (
      <div className="alert alert-success" role="status">
        <i className="fas fa-check" aria-hidden="true"></i>
        <span>{state.message}</span>
      </div>
    )
  }

  if (state.status === 'error' && state.message) {
    return (
      <div className="alert alert-error" role="alert">
        <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
        <span>{state.message}</span>
      </div>
    )
  }

  return null
}
