import type { Metadata } from 'next'

import { deleteEnquiry, toggleEnquiryRead } from '@/app/actions/admin'
import AdminTitle from '@/components/admin/AdminTitle'
import SavedNotice from '@/components/admin/SavedNotice'
import { readRows } from '@/lib/store'
import type { Enquiry } from '@/lib/types'

export const metadata: Metadata = { title: 'Enquiries — Admin' }
export const dynamic = 'force-dynamic'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Read-only list of contact form submissions.
 *
 * There is no create or edit form here: the public form writes these, and the
 * panel only marks one read or removes it.
 */
export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams

  // Newest first — an enquiry is only interesting while it is fresh.
  const enquiries = (await readRows<Enquiry>('enquiries')).sort(
    (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id
  )

  const unread = enquiries.filter((entry) => !entry.read).length
  const undelivered = enquiries.filter((entry) => !entry.emailed).length

  return (
    <>
      <AdminTitle>Enquiries</AdminTitle>
      <SavedNotice saved={saved} />

      {undelivered > 0 && (
        <div className="alert alert-error" role="status">
          <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
          <span>
            {undelivered} {undelivered === 1 ? 'enquiry' : 'enquiries'} never reached your inbox —
            this page holds the only copy. Check that <code>RESEND_API_KEY</code> is set in Vercel.
          </span>
        </div>
      )}

      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3>All Enquiries</h3>
          <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
            {enquiries.length} total{unread > 0 ? ` · ${unread} unread` : ''}
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>From</th>
                <th>Project</th>
                <th>Message</th>
                <th>Emailed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No enquiries yet — messages sent through the contact form appear here.
                  </td>
                </tr>
              ) : (
                enquiries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted2)' }}>
                      {!entry.read && (
                        <span className="badge badge-green" style={{ marginRight: '.4rem' }}>
                          New
                        </span>
                      )}
                      {formatDate(entry.created_at)}
                    </td>
                    <td>
                      <div className="cell-strong">{entry.name}</div>
                      <div style={{ fontSize: '.8rem' }}>
                        <a href={`mailto:${entry.email}`}>{entry.email}</a>
                      </div>
                      {entry.phone && (
                        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                          <a href={`tel:${entry.phone.replace(/[^\d+]/g, '')}`}>{entry.phone}</a>
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--muted2)' }}>{entry.project_type || '—'}</td>
                    <td style={{ maxWidth: '380px', color: 'var(--muted2)' }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{entry.message}</div>
                    </td>
                    <td>
                      <span className={`badge ${entry.emailed ? 'badge-green' : 'badge-gray'}`}>
                        {entry.emailed ? 'Sent' : 'Not sent'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <form action={toggleEnquiryRead}>
                          <input type="hidden" name="id" value={entry.id} />
                          <button type="submit" className="btn btn-outline-sm btn-icon-sm">
                            {entry.read ? 'Unread' : 'Read'}
                          </button>
                        </form>
                        <form action={deleteEnquiry} data-confirm="Delete this enquiry?">
                          <input type="hidden" name="id" value={entry.id} />
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
