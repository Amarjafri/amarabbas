'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { saveProject, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'
import type { Project } from '@/lib/types'

const CATEGORIES = [
  'eCommerce',
  'Web Application',
  'EdTech',
  'SaaS',
  'Business / Corporate',
  'Portfolio',
  'CMS / WordPress',
  'API / Backend',
  'Other',
]

/**
 * Ported from resources/views/admin/projects/form.blade.php, including the
 * per-image gallery removal toggles.
 */
export default function ProjectForm({
  project,
  galleryUrls,
  mainImageUrl,
}: {
  project: Project | null
  /** Resolved public URLs, keyed by the stored path so the checkbox can post the path. */
  galleryUrls: Array<{ path: string; url: string }>
  mainImageUrl: string | null
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveProject, { status: 'idle' })

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/projects" className="btn btn-outline-sm">
          ← Back to Projects
        </Link>
      </div>

      <AdminFormStatus state={state} />

      <div className="admin-form-card" style={{ maxWidth: '900px' }}>
        <form action={formAction}>
          {project && <input type="hidden" name="id" value={project.id} />}

          <div className="form-row-2">
            <div className="form-group">
              <label>Project Title *</label>
              <input
                type="text"
                name="title"
                defaultValue={project?.title ?? ''}
                required
                placeholder="e.g. Monk Cables"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" required defaultValue={project?.category ?? ''}>
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option value={cat} key={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Project Type / Subtitle</label>
              <input
                type="text"
                name="project_type"
                defaultValue={project?.project_type ?? ''}
                placeholder="e.g. Full-Stack eCommerce Platform"
              />
            </div>
            <div className="form-group">
              <label>Client Name</label>
              <input
                type="text"
                name="client_name"
                defaultValue={project?.client_name ?? ''}
                placeholder="e.g. Eden Prime"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              rows={5}
              required
              defaultValue={project?.description ?? ''}
              placeholder="Describe the project, your role, and what was built..."
            />
          </div>

          <div className="form-group">
            <label>Impact / Result</label>
            <input
              type="text"
              name="impact"
              maxLength={160}
              defaultValue={project?.impact ?? ''}
              placeholder="e.g. Serves 4,000+ students across 60 live exams"
            />
            <small
              style={{
                display: 'block',
                marginTop: '.35rem',
                fontSize: '.78rem',
                color: 'var(--muted)',
              }}
            >
              One measurable outcome. Shown as the highlighted line on project cards — leave blank
              to hide it.
            </small>
          </div>

          <div className="form-group">
            <label>Challenges &amp; Solutions</label>
            <textarea
              name="challenges"
              rows={3}
              defaultValue={project?.challenges ?? ''}
              placeholder="Technical challenges faced and how you solved them..."
            />
          </div>

          <div className="form-group">
            <label>Tech Stack * (comma-separated)</label>
            <input
              type="text"
              name="tech_stack"
              defaultValue={project?.tech_stack ?? ''}
              required
              placeholder="Laravel, Vue.js, MySQL, REST API, AWS"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Live URL</label>
              <input
                type="url"
                name="live_url"
                defaultValue={project?.live_url ?? ''}
                placeholder="https://example.com"
              />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="url"
                name="github_url"
                defaultValue={project?.github_url ?? ''}
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                defaultValue={project?.year ?? new Date().getFullYear()}
                min={2018}
                max={2030}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" defaultValue={project?.status ?? 'completed'}>
                <option value="completed">Completed</option>
                <option value="ongoing">Ongoing</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* MAIN IMAGE */}
          <div className="form-group">
            <label>Main Project Image</label>
            {mainImageUrl && (
              <div style={{ marginBottom: '.75rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainImageUrl}
                  alt=""
                  style={{ height: '120px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                  Current image. Upload new to replace.
                </p>
              </div>
            )}
            <label className="img-upload-wrap" htmlFor="mainImg" style={{ cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="img-preview" alt="Preview" />
              <div>🖼️</div>
              <p>Click to upload main project image</p>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                Recommended: 1200×700px · max 4 MB
              </p>
            </label>
            <input
              type="file"
              id="mainImg"
              name="image"
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* GALLERY */}
          <div className="form-group">
            <label>Gallery Images (multiple)</label>
            {galleryUrls.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '.75rem',
                  }}
                >
                  {galleryUrls.map(({ path, url }) => (
                    <label className="gal-thumb" key={path}>
                      <input type="checkbox" name="remove_gallery" value={path} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" />
                      <span className="gal-thumb-x" title="Mark for deletion">
                        ✕
                      </span>
                    </label>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '.75rem',
                    color: 'var(--muted)',
                    marginBottom: '.5rem',
                  }}
                >
                  Click ✕ on an image to mark it for deletion, then save. New uploads are added to
                  the existing gallery.
                </p>
              </>
            )}
            <div className="img-upload-wrap">
              <div>📁</div>
              <p>Click to upload multiple gallery images</p>
              <input
                type="file"
                name="gallery"
                accept="image/*"
                multiple
                style={{ marginTop: '.5rem' }}
              />
            </div>
          </div>

          <div
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}
          >
            <label className="form-check">
              <input
                type="checkbox"
                name="is_featured"
                value="1"
                defaultChecked={project?.is_featured ?? false}
              />
              Mark as Featured (shows on homepage)
            </label>
            <div
              className="form-group"
              style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <label style={{ margin: 0 }}>Sort Order:</label>
              <input
                type="number"
                name="sort_order"
                defaultValue={project?.sort_order ?? 0}
                style={{ width: '80px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <SubmitButton>{project ? 'Update Project' : 'Create Project'}</SubmitButton>
            <Link href="/admin/projects" className="btn btn-outline-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
