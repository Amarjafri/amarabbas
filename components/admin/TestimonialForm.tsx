'use client'

import { useActionState } from 'react'

import { saveTestimonial, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'

/** The inline "add testimonial" card from admin/testimonials.blade.php. */
export default function TestimonialForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(saveTestimonial, {
    status: 'idle',
  })

  return (
    <>
      <AdminFormStatus state={state} />

      <div className="admin-form-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-heading">Add Testimonial</h3>

        <form action={formAction} key={state.status === 'success' ? 'reset' : 'form'}>
          <div className="form-row-2">
            <div className="form-group">
              <label>Client Name *</label>
              <input type="text" name="name" required placeholder="e.g. Sarah Khan" />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input type="text" name="position" placeholder="e.g. Founder" />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Company</label>
              <input type="text" name="company" placeholder="e.g. Eden Prime" />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input type="number" name="sort_order" defaultValue={0} />
            </div>
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              name="message"
              rows={4}
              required
              placeholder="What the client said about working with you..."
            />
          </div>

          <div className="form-group">
            <label>Avatar</label>
            <label className="img-upload-wrap" htmlFor="testiAvatar" style={{ cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="img-preview" alt="Preview" />
              <div>🙂</div>
              <p>Click to upload an avatar — optional, max 4 MB</p>
            </label>
            <input
              type="file"
              id="testiAvatar"
              name="avatar"
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <label className="form-check">
            <input type="checkbox" name="active" value="1" defaultChecked />
            <span>Show on the homepage</span>
          </label>

          <div className="form-actions">
            <SubmitButton>Add Testimonial</SubmitButton>
          </div>
        </form>
      </div>
    </>
  )
}
