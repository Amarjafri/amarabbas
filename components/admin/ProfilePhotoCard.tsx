'use client'

import { useActionState } from 'react'

import { uploadProfilePhoto, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'

/** The Profile Photo card from admin/settings.blade.php. */
export default function ProfilePhotoCard({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(uploadProfilePhoto, {
    status: 'idle',
  })

  return (
    <div className="admin-form-card" style={{ marginBottom: '1.5rem' }}>
      <h3 className="card-heading">Profile Photo</h3>

      <AdminFormStatus state={state} />

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {currentUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Current profile photo"
            style={{
              width: '110px',
              height: '130px',
              objectFit: 'cover',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          />
        )}

        <form action={formAction} style={{ flex: 1, minWidth: '260px' }}>
          <div className="form-group">
            <label className="img-upload-wrap" htmlFor="photoInput" style={{ cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="img-preview" id="photoPreview" alt="" />
              <div>
                <i className="fas fa-camera" aria-hidden="true"></i>
              </div>
              <p>Click to upload — JPG or PNG, max 4 MB</p>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                Recommended: 400×450px portrait
              </p>
            </label>
            <input
              type="file"
              id="photoInput"
              name="photo"
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <SubmitButton pendingLabel="Uploading…">Upload Photo</SubmitButton>
        </form>
      </div>
    </div>
  )
}
