import type { Metadata } from 'next'
import Link from 'next/link'

import { deletePost } from '@/app/actions/admin'
import AdminTitle from '@/components/admin/AdminTitle'
import SavedNotice from '@/components/admin/SavedNotice'
import { storageUrl, strLimit } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { readRows } from '@/lib/store'
import type { BlogPost } from '@/lib/types'

export const metadata: Metadata = { title: 'Blog Posts — Admin' }
export const dynamic = 'force-dynamic'

/** Ported from resources/views/admin/blog/index.blade.php. */
export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const posts = (await readRows<BlogPost>('blog_posts')).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <>
      <AdminTitle>Blog Posts</AdminTitle>
      <SavedNotice saved={saved} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{posts.length} posts total</p>
        <Link href="/admin/blog/create" className="btn btn-primary-sm">
          ✍️ Write New Post
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
                <th>Read Time</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    No posts yet.{' '}
                    <Link href="/admin/blog/create" style={{ color: 'var(--accent)' }}>
                      Write your first one →
                    </Link>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      {post.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={storageUrl(post.image)}
                          alt=""
                          style={{
                            width: '70px',
                            height: '45px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '70px',
                            height: '45px',
                            background: 'var(--bg2)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '.8rem',
                            color: 'var(--muted)',
                          }}
                        >
                          ✍️
                        </div>
                      )}
                    </td>
                    <td className="cell-strong" style={{ maxWidth: '220px' }}>
                      {strLimit(post.title, 55)}
                    </td>
                    <td>
                      <span className="badge badge-blue">{post.category}</span>
                    </td>
                    <td style={{ color: 'var(--muted2)' }}>{post.read_time ?? '5'} min</td>
                    <td>
                      <span className={`badge ${post.published ? 'badge-green' : 'badge-gray'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                      {formatDate(post.created_at, 'M d, Y')}
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="btn btn-outline-sm btn-icon-sm"
                        >
                          Edit
                        </Link>
                        {post.published && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="btn btn-outline-sm btn-icon-sm"
                          >
                            View
                          </Link>
                        )}
                        <form action={deletePost} data-confirm="Delete this post?">
                          <input type="hidden" name="id" value={post.id} />
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
