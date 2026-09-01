'use client'

import { useActionState } from 'react'

import { deleteCv, uploadCv, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'

/**
 * The CV card from admin/settings.blade.php. Uploading writes the stored path
 * into `cv_file` automatically, so the path field below never has to be typed.
 */
export default function CvCard({ cvPath }: { cvPath: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(uploadCv, { status: 'idle' })

  const href = cvPath
    ? /^https?:\/\//i.test(cvPath) || cvPath.startsWith('/')
      ? cvPath
      : `/${cvPath}`
    : ''
  const fileName = cvPath ? cvPath.split('/').pop() : ''

  return (
    <div className="admin-form-card" style={{ marginBottom: '1.5rem' }}>
      <h3 className="card-heading">CV / Resume</h3>

      <AdminFormStatus state={state} />

      {cvPath ? (
        <div
          style={{
            display: 'flex',
            gap: '.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <i
            className="fas fa-file-pdf"
            aria-hidden="true"
            style={{ fontSize: '1.5rem', color: '#dc2626' }}
          ></i>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '.9rem', wordBreak: 'break-all' }}>{fileName}</div>
            <small style={{ color: 'var(--muted)' }}>Served from {href}</small>
          </div>
          <a href={href} target="_blank" rel="noopener" className="btn btn-outline-sm">
            View ↗
          </a>
          <form
            action={deleteCv}
            data-confirm="Remove the CV? The download button will be hidden until you upload a new one."
          >
            <button
              type="submit"
              className="btn btn-outline-sm"
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
            >
              Remove
            </button>
          </form>
        </div>
      ) : (
        <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          No CV set — the hero download button is hidden.
        </p>
      )}

      <form action={formAction}>
        <div className="form-group">
          <label className="img-upload-wrap" htmlFor="cvInput" style={{ cursor: 'pointer' }}>
            <div>
              <i className="fas fa-file-arrow-up" aria-hidden="true"></i>
            </div>
            <p>Click to upload — PDF, DOC or DOCX, max 5 MB</p>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>
              Replaces the current CV and updates the path below automatically.
            </p>
          </label>
          <input
            type="file"
            id="cvInput"
            name="cv"
            accept=".pdf,.doc,.docx,application/pdf"
            style={{ display: 'none' }}
          />
        </div>
        <SubmitButton pendingLabel="Uploading…">Upload CV</SubmitButton>
      </form>
    </div>
  )
}
