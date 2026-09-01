import type { ReactNode } from 'react'

const MESSAGES: Record<string, string> = {
  created: 'Created.',
  updated: 'Updated.',
  deleted: 'Deleted.',
  toggled: 'Visibility updated.',
  'cv-removed': 'CV removed — the download button is now hidden.',
}

/** Stands in for Laravel's `session('success')` flash after a redirect. */
export default function SavedNotice({ saved }: { saved?: string }): ReactNode {
  const message = saved ? MESSAGES[saved] : undefined
  if (!message) return null

  return (
    <div className="alert alert-success" role="status">
      <i className="fas fa-check" aria-hidden="true"></i>
      <span>{message}</span>
    </div>
  )
}
