import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { deleteContentItem, toggleContentItem } from '@/app/actions/admin'
import AdminTitle from '@/components/admin/AdminTitle'
import SavedNotice from '@/components/admin/SavedNotice'
import { CONTENT_TYPES, contentType } from '@/lib/content-types'
import { strLimit } from '@/lib/data'
import { readRows } from '@/lib/store'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return Object.keys(CONTENT_TYPES).map((type) => ({ type }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  const config = contentType(type)
  return { title: `${config?.label ?? 'Content'} — Admin` }
}

type Row = Record<string, unknown> & { id: number; sort_order: number; active: boolean }

/** Ported from resources/views/admin/content/index.blade.php. */
export default async function ContentIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { type } = await params
  const { saved } = await searchParams
  const config = contentType(type)

  if (!config) notFound()

  const rows = (await readRows<Row>(config.collection)).sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  )

  const columns = Object.entries(config.columns)

  return (
    <>
      <AdminTitle>{config.label}</AdminTitle>
      <SavedNotice saved={saved} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', maxWidth: '60ch' }}>{config.intro}</p>
        <Link href={`/admin/content/${type}/create`} className="btn btn-primary-sm">
          ➕ Add {config.singular}
        </Link>
      </div>

      <div className="admin-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Order</th>
                {columns.map(([field, label]) => (
                  <th key={field}>{label}</th>
                ))}
                <th>Visible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 3} className="table-empty">
                    Nothing here yet.{' '}
                    <Link
                      href={`/admin/content/${type}/create`}
                      style={{ color: 'var(--accent)' }}
                    >
                      Add your first {config.singular.toLowerCase()} →
                    </Link>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="num">{row.sort_order}</td>
                    {columns.map(([field], index) => (
                      <td key={field} className={index === 0 ? 'cell-strong' : undefined}>
                        {strLimit(String(row[field] ?? '') || '—', 70)}
                      </td>
                    ))}
                    <td>
                      <span className={`badge ${row.active ? 'badge-green' : 'badge-gray'}`}>
                        {row.active ? 'Shown' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Link
                          href={`/admin/content/${type}/${row.id}/edit`}
                          className="btn btn-outline-sm btn-icon-sm"
                        >
                          Edit
                        </Link>
                        <form action={toggleContentItem}>
                          <input type="hidden" name="type" value={type} />
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="btn btn-outline-sm btn-icon-sm">
                            {row.active ? 'Hide' : 'Show'}
                          </button>
                        </form>
                        <form
                          action={deleteContentItem}
                          data-confirm={`Delete this ${config.singular.toLowerCase()}?`}
                        >
                          <input type="hidden" name="type" value={type} />
                          <input type="hidden" name="id" value={row.id} />
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
