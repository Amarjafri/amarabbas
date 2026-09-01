import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import CopyLinkButton from '@/components/CopyLinkButton'
import { formatDate } from '@/lib/format'
import {
  getPostBySlug,
  getPosts,
  getRelatedPosts,
  nl2brEscaped,
  setting,
  storageUrl,
  strLimit,
} from '@/lib/data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amarabbas.dev'

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) return { title: 'Article not found — Amar Abbas' }

  const title = `${post.title} — Amar Abbas Blog`

  return {
    title,
    description: post.excerpt,
    openGraph: {
      title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.created_at,
      images: post.image ? [storageUrl(post.image)] : ['/images/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.excerpt,
      images: post.image ? [storageUrl(post.image)] : ['/images/og-image.jpg'],
    },
  }
}

/** Ported from resources/views/blog/show.blade.php. */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const related = getRelatedPosts(post)
  const shareUrl = `${siteUrl}/blog/${post.slug}`

  return (
    <>
      <section className="page-hero page-hero-sm">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/blog">Blog</Link>
            <span>/</span>
            <span>{strLimit(post.title, 40)}</span>
          </div>
        </div>
      </section>

      <section className="blog-post-page section-pad">
        <div className="container">
          <div className="bp-grid">
            {/* ── POST ── */}
            <article className="bp-content">
              <span className="blog-category-tag">{post.category}</span>

              <h1 className="bp-title">{post.title}</h1>

              <div className="bp-meta">
                <span>{formatDate(post.created_at, 'F d, Y')}</span>
                <span>{post.read_time ?? 5} min read</span>
                <span>Amar Abbas</span>
              </div>

              {post.image && (
                <div className="bp-hero-img">
                  <Image src={storageUrl(post.image)} alt={post.title} width={1200} height={700} priority />
                </div>
              )}

              <div className="bp-body" dangerouslySetInnerHTML={{ __html: nl2brEscaped(post.body) }} />

              <div className="bp-author">
                <div className="bp-author-avatar" aria-hidden="true">
                  {setting('initials')}
                </div>
                <div>
                  <strong>{setting('name')}</strong>
                  <p>{setting('author_bio')}</p>
                  <div className="bp-author-links">
                    {setting('linkedin') && (
                      <a href={setting('linkedin')} target="_blank" rel="noopener noreferrer">
                        LinkedIn ↗
                      </a>
                    )}
                    {setting('github') && (
                      <a href={setting('github')} target="_blank" rel="noopener noreferrer">
                        GitHub ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>

            {/* ── SIDEBAR ── */}
            <aside className="bp-sidebar">
              <div className="bp-widget">
                <h4>Share Article</h4>
                <div className="bp-widget-stack">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn"
                  >
                    Share on LinkedIn
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn"
                  >
                    Share on X
                  </a>
                  <CopyLinkButton />
                </div>
              </div>

              <div className="bp-widget">
                <h4>About the Author</h4>
                <div className="bp-author-card">
                  <div className="bp-author-avatar" aria-hidden="true">
                    AA
                  </div>
                  <strong>Amar Abbas</strong>
                  <p>
                    Senior Full-Stack Developer with 3+ years experience in Laravel &amp; Vue.js.
                  </p>
                  <Link href="/#contact" className="btn-primary">
                    Hire Me →
                  </Link>
                </div>
              </div>

              {related.length > 0 && (
                <div className="bp-widget">
                  <h4>Related Articles</h4>
                  {related.map((r) => (
                    <Link href={`/blog/${r.slug}`} className="related-post" key={r.id}>
                      {r.image ? (
                        <Image
                          src={storageUrl(r.image)}
                          alt=""
                          width={200}
                          height={140}
                          loading="lazy"
                        />
                      ) : (
                        <div className="rp-placeholder" aria-hidden="true">
                          ✍
                        </div>
                      )}
                      <div>
                        <span>{r.category}</span>
                        <p>{strLimit(r.title, 55)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
