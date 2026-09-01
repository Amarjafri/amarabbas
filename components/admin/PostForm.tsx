'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { savePost, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'
import type { BlogPost } from '@/lib/types'

const CATEGORIES = [
  'Laravel',
  'Vue.js',
  'PHP',
  'Web Development',
  'DevOps',
  'eCommerce',
  'Career',
  'Tutorial',
  'Other',
]

const cardHeading: React.CSSProperties = {
  fontSize: '.85rem',
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  marginBottom: '1rem',
}

/**
 * Ported from resources/views/admin/blog/form.blade.php.
 *
 * The Blade version put the sidebar's category/read-time/publish controls in a
 * second <div> outside the <form> and relied on a `form=` attribute that was
 * only half wired; here everything is inside one form so those fields actually
 * submit.
 */
export default function PostForm({
  post,
  imageUrl,
}: {
  post: BlogPost | null
  imageUrl: string | null
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(savePost, { status: 'idle' })

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/blog" className="btn btn-outline-sm">
          ← Back to Posts
        </Link>
      </div>

      <AdminFormStatus state={state} />

      <form action={formAction}>
        {post && <input type="hidden" name="id" value={post.id} />}

        <div className="post-editor-grid">
          {/* MAIN FORM */}
          <div className="admin-form-card" style={{ maxWidth: '100%' }}>
            <div className="form-group">
              <label>Post Title *</label>
              <input
                type="text"
                name="title"
                defaultValue={post?.title ?? ''}
                required
                placeholder="e.g. Building Scalable APIs with Laravel"
                style={{ fontSize: '1.05rem', padding: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label>Excerpt / Summary *</label>
              <textarea
                name="excerpt"
                rows={2}
                required
                defaultValue={post?.excerpt ?? ''}
                placeholder="Short summary shown in blog listings (max 300 chars)..."
              />
            </div>

            <div className="form-group">
              <label>Full Content *</label>
              <textarea
                name="body"
                id="postBody"
                rows={16}
                required
                defaultValue={post?.body ?? ''}
                placeholder="Write your full article here..."
                style={{ fontSize: '.92rem', lineHeight: 1.7 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <SubmitButton className="btn btn-primary-sm post-submit">
                {post ? '✓ Update Post' : '✓ Publish Post'}
              </SubmitButton>
              <Link
                href="/admin/blog"
                className="btn btn-outline-sm"
                style={{ padding: '.85rem 1.5rem' }}
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* SIDEBAR OPTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="admin-form-card" style={{ maxWidth: '100%' }}>
              <h4 style={cardHeading}>Publish Settings</h4>
              <div className="form-group">
                <label>Category *</label>
                <select name="category" required defaultValue={post?.category ?? CATEGORIES[0]}>
                  {CATEGORIES.map((cat) => (
                    <option value={cat} key={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Read Time (minutes)</label>
                <input
                  type="number"
                  name="read_time"
                  defaultValue={post?.read_time ?? 5}
                  min={1}
                  max={60}
                />
              </div>
              <label className="form-check" style={{ marginTop: '.5rem' }}>
                <input
                  type="checkbox"
                  name="published"
                  value="1"
                  defaultChecked={post?.published ?? false}
                />
                <span style={{ color: 'var(--text)' }}>Publish immediately</span>
              </label>
            </div>

            <div className="admin-form-card" style={{ maxWidth: '100%' }}>
              <h4 style={cardHeading}>Featured Image</h4>
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '.75rem',
                    }}
                  />
                  <p
                    style={{
                      fontSize: '.75rem',
                      color: 'var(--muted)',
                      marginBottom: '.75rem',
                    }}
                  >
                    Upload new to replace current
                  </p>
                </>
              )}
              <div className="form-group">
                <label className="img-upload-wrap" htmlFor="blogImg" style={{ cursor: 'pointer' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="img-preview"
                    alt="Preview"
                    style={{ width: '100%', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div>
                    <div>🖼️</div>
                    <p>Click to upload image</p>
                    <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Recommended: 1200×630px · max 4 MB
                    </p>
                  </div>
                </label>
                <input
                  type="file"
                  id="blogImg"
                  name="image"
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div
              style={{
                background: 'rgba(74,144,245,.06)',
                border: '1px solid rgba(74,144,245,.15)',
                borderRadius: '10px',
                padding: '1.25rem',
              }}
            >
              <h4
                style={{
                  fontSize: '.82rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  marginBottom: '.75rem',
                }}
              >
                ✏️ Writing Tips
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  fontSize: '.8rem',
                  color: 'var(--muted2)',
                  lineHeight: 1.9,
                }}
              >
                <li>• Write for both local and international readers</li>
                <li>• Keep paragraphs short and scannable</li>
                <li>• Include code snippets when relevant</li>
                <li>• Add a clear call-to-action at the end</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
