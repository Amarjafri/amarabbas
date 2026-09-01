import type { Metadata } from 'next'

import { deleteTestimonial } from '@/app/actions/admin'
import AdminTitle from '@/components/admin/AdminTitle'
import SavedNotice from '@/components/admin/SavedNotice'
import TestimonialForm from '@/components/admin/TestimonialForm'
import { storageUrl, strLimit } from '@/lib/data'
import { readRows } from '@/lib/store'
import type { Testimonial } from '@/lib/types'

export const metadata: Metadata = { title: 'Testimonials — Admin' }
export const dynamic = 'force-dynamic'

/** Ported from resources/views/admin/testimonials.blade.php. */
export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const testimonials = (await readRows<Testimonial>('testimonials')).sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  )

  return (
    <>
      <AdminTitle>Testimonials</AdminTitle>
      <SavedNotice saved={saved} />

      <TestimonialForm />

      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3>All Testimonials</h3>
          <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
            {testimonials.length} total
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Company</th>
                <th>Message</th>
                <th>Showing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No testimonials yet — add one above and it appears on the homepage.
                  </td>
                </tr>
              ) : (
                testimonials.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={storageUrl(t.avatar)}
                          alt=""
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--bg2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--muted)',
                          }}
                        >
                          {t.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="cell-strong">{t.name}</td>
                    <td>
                      {t.position}
                      {t.position && t.company ? ' · ' : ''}
                      {t.company}
                    </td>
                    <td style={{ maxWidth: '320px', color: 'var(--muted2)' }}>
                      {strLimit(t.message, 90)}
                    </td>
                    <td>
                      <span className={`badge ${t.active ? 'badge-green' : 'badge-gray'}`}>
                        {t.active ? 'Yes' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <form action={deleteTestimonial} data-confirm="Delete this testimonial?">
                          <input type="hidden" name="id" value={t.id} />
                          <button type="submit" className="btn btn-danger-sm btn-icon-sm">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
