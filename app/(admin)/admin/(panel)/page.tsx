import type { Metadata } from 'next'
import Link from 'next/link'

import AdminTitle from '@/components/admin/AdminTitle'
import { formatDate } from '@/lib/format'
import { readRows } from '@/lib/store'
import type { BlogPost, Project, Testimonial } from '@/lib/types'

export const metadata: Metadata = { title: 'Dashboard — Admin' }
export const dynamic = 'force-dynamic'

/** Ported from resources/views/admin/dashboard.blade.php. */
export default async function AdminDashboard() {
  const [projects, posts, testimonials] = await Promise.all([
    readRows<Project>('projects'),
    readRows<BlogPost>('blog_posts'),
    readRows<Testimonial>('testimonials'),
  ])

  const featuredCount = projects.filter((p) => p.is_featured).length
  const publishedCount = posts.filter((p) => p.published).length
  const activeTestimonials = testimonials.filter((t) => t.active).length
  const missingImpact = projects.filter((p) => !p.impact).length

  const latestProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <>
      <AdminTitle>Dashboard</AdminTitle>

      {/* Summary before detail. Only the tile that needs action carries the
          accent stripe — everything else stays quiet so it reads at a glance. */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-icon">
              <i className="fas fa-folder-open" aria-hidden="true"></i>
            </span>
            <span className="stat-l">Projects</span>
          </div>
          <div className="stat-n">{projects.length}</div>
          <div className="stat-meta">
            <b>{featuredCount}</b> featured on the homepage
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-icon">
              <i className="fas fa-pen-nib" aria-hidden="true"></i>
            </span>
            <span className="stat-l">Blog Posts</span>
          </div>
          <div className="stat-n">{posts.length}</div>
          <div className="stat-meta">
            <b>{publishedCount}</b> published · <b>{posts.length - publishedCount}</b> draft
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-icon">
              <i className="fas fa-quote-left" aria-hidden="true"></i>
            </span>
            <span className="stat-l">Testimonials</span>
          </div>
          <div className="stat-n">{testimonials.length}</div>
          <div className="stat-meta">
            <b>{activeTestimonials}</b> showing on the site
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-icon">
              <i className="fas fa-inbox" aria-hidden="true"></i>
            </span>
            <span className="stat-l">Enquiries</span>
          </div>
          <div className="stat-n">
            <i className="fas fa-envelope" aria-hidden="true" style={{ fontSize: '1.6rem' }}></i>
          </div>
          <div className="stat-meta">Delivered straight to your inbox by email</div>
        </div>
      </div>

      {/* A real, actionable prompt rather than decoration. Only appears when
          there is something to fix. */}
      {missingImpact > 0 && (
        <div
          className="alert alert-error"
          role="status"
          style={{
            borderColor: 'var(--accent-line)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}
        >
          <i className="fas fa-circle-info" aria-hidden="true"></i>
          <span>
            <strong style={{ color: 'inherit' }}>{missingImpact}</strong>{' '}
            {missingImpact === 1 ? 'project has' : 'projects have'} no impact line yet — the
            highlighted result on each project card stays hidden until you add one.{' '}
            <Link
              href="/admin/projects"
              style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Add them →
            </Link>
          </span>
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="section-block">
        <div className="quick-actions">
          <Link href="/admin/projects/create" className="quick-action">
            <span className="qa-icon">
              <i className="fas fa-plus" aria-hidden="true"></i>
            </span>
            <span>
              <strong>Add Project</strong>
              <small>New case study</small>
            </span>
          </Link>

          <Link href="/admin/blog/create" className="quick-action">
            <span className="qa-icon">
              <i className="fas fa-feather" aria-hidden="true"></i>
            </span>
            <span>
              <strong>Write Post</strong>
              <small>New article</small>
            </span>
          </Link>

          <Link href="/admin/content/experiences" className="quick-action">
            <span className="qa-icon">
              <i className="fas fa-briefcase" aria-hidden="true"></i>
            </span>
            <span>
              <strong>Experience</strong>
              <small>Edit your timeline</small>
            </span>
          </Link>

          <Link href="/admin/settings" className="quick-action">
            <span className="qa-icon">
              <i className="fas fa-sliders" aria-hidden="true"></i>
            </span>
            <span>
              <strong>Settings &amp; Text</strong>
              <small>All site wording</small>
            </span>
          </Link>
        </div>
      </div>

      {/* ── RECENT PROJECTS ── */}
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3>Recent Projects</h3>
          <Link href="/admin/projects" className="btn btn-outline-sm">
            Manage
          </Link>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Category</th>
                <th>Impact line</th>
                <th>Featured</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {latestProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No projects yet — add your first one to populate the portfolio.
                  </td>
                </tr>
              ) : (
                latestProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="cell-strong">{project.title}</td>
                    <td>{project.category}</td>
                    <td>
                      {project.impact ? (
                        <span className="badge badge-green">Set</span>
                      ) : (
                        <span className="badge badge-amber">Missing</span>
                      )}
                    </td>
                    <td>
                      {project.is_featured ? (
                        <span className="badge badge-blue">Featured</span>
                      ) : (
                        <span className="badge badge-gray">Hidden</span>
                      )}
                    </td>
                    <td className="num">{formatDate(project.created_at, 'd M Y')}</td>
                    <td>
                      <div className="cell-actions">
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="btn btn-outline-sm btn-icon-sm"
                        >
                          Edit
                        </Link>
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
