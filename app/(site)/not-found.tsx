import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "This page doesn't exist. — Amar Abbas",
}

/**
 * Ported from resources/views/errors/404.blade.php + errors/layout.blade.php.
 * A lost visitor keeps the nav and footer (they live in the root layout) and
 * gets somewhere useful.
 */
export default function NotFound() {
  return (
    <section className="error-page">
      <div className="container">
        <div className="error-inner">
          <div className="error-code">
            404
            <span>Page not found</span>
          </div>

          <div className="error-body">
            <h1 className="error-title">This page doesn&apos;t exist.</h1>
            <p className="error-desc">
              The link may be broken, or the page may have been moved or renamed. Nothing is wrong
              on your end.
            </p>

            <div className="error-actions">
              <Link href="/" className="btn-primary">
                Back to home →
              </Link>
              <Link href="/projects" className="btn-ghost">
                Browse projects
              </Link>
            </div>

            <div className="error-links">
              <h2>Try one of these</h2>
              <ul>
                <li>
                  <Link href="/">
                    <i className="fas fa-house" aria-hidden="true"></i> Home
                  </Link>
                </li>
                <li>
                  <Link href="/projects">
                    <i className="fas fa-folder-open" aria-hidden="true"></i> Projects
                  </Link>
                </li>
                <li>
                  <Link href="/blog">
                    <i className="fas fa-pen-nib" aria-hidden="true"></i> Blog
                  </Link>
                </li>
                <li>
                  <Link href="/#contact">
                    <i className="fas fa-envelope" aria-hidden="true"></i> Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
