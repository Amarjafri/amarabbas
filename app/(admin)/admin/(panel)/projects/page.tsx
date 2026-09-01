import type { Metadata } from 'next'
import Link from 'next/link'

import { deleteProject } from '@/app/actions/admin'
import AdminTitle from '@/components/admin/AdminTitle'
import SavedNotice from '@/components/admin/SavedNotice'
import { storageUrl } from '@/lib/data'
import { readRows } from '@/lib/store'
import type { Project } from '@/lib/types'

export const metadata: Metadata = { title: 'Projects — Admin' }
export const dynamic = 'force-dynamic'

/** Ported from resources/views/admin/projects/index.blade.php. */
export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const projects = (await readRows<Project>('projects')).sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  )

  return (
    <>
      <AdminTitle>Projects</AdminTitle>
      <SavedNotice saved={saved} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          {projects.length} projects total
        </p>
        <Link href="/admin/projects/create" className="btn btn-primary-sm">
          ➕ Add New Project
        </Link>
      </div>

      <div className="admin-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No projects yet.{' '}
                    <Link href="/admin/projects/create" style={{ color: 'var(--accent)' }}>
                      Add your first project →
                    </Link>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      {project.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={storageUrl(project.image)}
                          alt=""
                          style={{
                            width: '60px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '60px',
                            height: '40px',
                            background: 'var(--bg2)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '.7rem',
                            color: 'var(--muted)',
                          }}
                        >
                          No img
                        </div>
                      )}
                    </td>
                    <td className="cell-strong">{project.title}</td>
                    <td>{project.category}</td>
                    <td>
                      <span className={`badge ${project.is_featured ? 'badge-green' : 'badge-gray'}`}>
                        {project.is_featured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="btn btn-outline-sm btn-icon-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="btn btn-outline-sm btn-icon-sm"
                        >
                          View
                        </Link>
                        <form action={deleteProject} data-confirm="Delete this project?">
                          <input type="hidden" name="id" value={project.id} />
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
