import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { formatDate } from '@/lib/format'
import { getPostCategories, getPosts, setting, slugify, storageUrl, strLimit } from '@/lib/data'

export const metadata: Metadata = {
  title: setting('blog_page_meta'),
  description: setting('blog_page_desc'),
  openGraph: {
    title: setting('blog_page_meta'),
    description: setting('blog_page_desc'),
  },
}

/** Ported from resources/views/blog/index.blade.php. */
export default function BlogPage() {
  const posts = getPosts()
  const categories = getPostCategories()
  const featuredPost = posts[0]
  const rest = posts.slice(1)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="page-hero-content">
            <div className="section-tag">{setting('blog_page_tag')}</div>
            <h1 className="page-hero-title">{setting('blog_page_title')}</h1>
            <p className="page-hero-desc">{setting('blog_page_desc')}</p>
          </div>
        </div>
      </section>

      <section className="blog-page section-pad">
        <div className="container">
          {/* FEATURED POST */}
          {featuredPost && (
            <div className="blog-featured reveal">
              <div className="bf-img-wrap">
                {featuredPost.image ? (
                  <Image
                    src={storageUrl(featuredPost.image)}
                    alt={featuredPost.title}
                    width={1200}
                    height={700}
                    priority
                  />
                ) : (
                  <div className="bf-img-placeholder">
                    <span>✍️</span>
                  </div>
                )}
              </div>
              <div className="bf-content">
                <span className="blog-category-tag">{featuredPost.category}</span>
                <h2 className="bf-title">{featuredPost.title}</h2>
                <p className="bf-excerpt">{strLimit(featuredPost.excerpt, 180)}</p>
                <div className="bf-meta">
                  <span>{formatDate(featuredPost.created_at, 'M d, Y')}</span>
                  <span>·</span>
                  <span>{featuredPost.read_time ?? '5'} min read</span>
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="btn-primary">
                  Read Article →
                </Link>
              </div>
            </div>
          )}

          {/* BLOG GRID */}
          <div className="blog-filter-bar reveal" role="group" aria-label="Filter articles by category">
            <button type="button" className="filter-btn active" data-filter="all" aria-pressed="true">
              All
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                className="filter-btn"
                data-filter={slugify(cat)}
                aria-pressed="false"
                key={cat}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="blog-full-grid">
            {rest.map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                className="blog-full-card reveal"
                data-category={slugify(post.category)}
                key={post.id}
              >
                <div className="bfc-img-wrap">
                  {post.image ? (
                    <Image
                      src={storageUrl(post.image)}
                      alt={post.title}
                      className="bfc-img"
                      width={800}
                      height={500}
                    />
                  ) : (
                    <div className="bfc-img-placeholder">
                      <span>✍️</span>
                    </div>
                  )}
                  <span className="blog-category-tag">{post.category}</span>
                </div>
                <div className="bfc-info">
                  <span className="bfc-date">
                    {formatDate(post.created_at, 'M d, Y')} · {post.read_time ?? '5'} min read
                  </span>
                  <h3 className="bfc-title">{post.title}</h3>
                  <p className="bfc-excerpt">{strLimit(post.excerpt, 100)}</p>
                  <span className="bfc-read">Read Article →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Laravel paginated 9 per page; the control renders empty at this size. */}
          <div className="pagination-wrap"></div>
        </div>
      </section>
    </>
  )
}
