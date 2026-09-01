import Link from 'next/link'

import AdminChrome from '@/components/admin/AdminChrome'
import AdminSidebarLink from '@/components/admin/AdminSidebarLink'
import LogoutButton from '@/components/admin/LogoutButton'
import { contentMenu } from '@/lib/content-types'
import { readObject, savesAreDeferred } from '@/lib/store'
import type { Settings } from '@/lib/types'

/**
 * Ported from resources/views/layouts/admin.blade.php.
 *
 * Reads settings through lib/store so the sidebar shows the values that were
 * just saved, rather than whatever was bundled at the last build.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  let settings: Settings = {}

  try {
    settings = await readObject<Settings>('settings')
  } catch {
    // A store outage must never lock the operator out of the panel.
  }

  const initials = settings.initials || 'AA'
  const name = settings.name || 'Administrator'

  return (
    <>
      <div className="sidebar-scrim" id="sidebarScrim"></div>

      <div className="admin-shell">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-logo">
            <span className="logo-line">
              <span className="logo-text">{initials}</span>
              <span className="logo-dot"></span>
            </span>
            <p>Admin Panel</p>
          </div>

          <nav aria-label="Admin sections">
            <div className="nav-section">Overview</div>
            <ul>
              <li>
                <AdminSidebarLink href="/admin" exact>
                  <i className="fas fa-chart-simple nav-icon" aria-hidden="true"></i> Dashboard
                </AdminSidebarLink>
              </li>
            </ul>

            <div className="nav-section">Content</div>
            <ul>
              <li>
                <AdminSidebarLink href="/admin/projects">
                  <i className="fas fa-folder-open nav-icon" aria-hidden="true"></i> Projects
                </AdminSidebarLink>
              </li>
              <li>
                <AdminSidebarLink href="/admin/blog">
                  <i className="fas fa-pen-nib nav-icon" aria-hidden="true"></i> Blog Posts
                </AdminSidebarLink>
              </li>
              <li>
                <AdminSidebarLink href="/admin/testimonials">
                  <i className="fas fa-quote-left nav-icon" aria-hidden="true"></i> Testimonials
                </AdminSidebarLink>
              </li>
            </ul>

            <div className="nav-section">Site Content</div>
            <ul>
              {contentMenu().map((entry) => (
                <li key={entry.key}>
                  <AdminSidebarLink href={`/admin/content/${entry.key}`}>
                    <i className={`${entry.icon} nav-icon`} aria-hidden="true"></i> {entry.label}
                  </AdminSidebarLink>
                </li>
              ))}
            </ul>

            <div className="nav-section">Site</div>
            <ul>
              <li>
                <AdminSidebarLink href="/admin/settings">
                  <i className="fas fa-sliders nav-icon" aria-hidden="true"></i> Settings &amp; Text
                </AdminSidebarLink>
              </li>
              <li>
                <Link href="/" target="_blank" rel="noopener">
                  <i className="fas fa-arrow-up-right-from-square nav-icon" aria-hidden="true"></i>{' '}
                  View Portfolio
                </Link>
              </li>
            </ul>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <span className="avatar" aria-hidden="true">
                {initials}
              </span>
              <span>
                <strong>{name}</strong>
                <small>Administrator</small>
              </span>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="admin-main">
          <header className="admin-topbar">
            <button
              type="button"
              className="icon-btn sidebar-toggle"
              id="sidebarToggle"
              aria-label="Open menu"
              aria-expanded="false"
              aria-controls="sidebar"
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>

            <h1 id="adminTitle">Admin</h1>

            <div className="topbar-actions">
              <button
                type="button"
                className="icon-btn"
                id="themeToggle"
                aria-label="Switch colour theme"
              >
                <i className="fas fa-moon icon-moon" aria-hidden="true"></i>
                <i className="fas fa-sun icon-sun" aria-hidden="true"></i>
              </button>
              <Link
                href="/"
                target="_blank"
                rel="noopener"
                className="icon-btn"
                aria-label="View portfolio in a new tab"
              >
                <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </Link>
            </div>
          </header>

          <div className="admin-content">
            {savesAreDeferred() && (
              <div
                className="alert"
                role="status"
                style={{
                  border: '1px solid var(--accent-line)',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <i className="fas fa-circle-info" aria-hidden="true"></i>
                <span>
                  Saved changes are committed to GitHub and go live in about a minute once Vercel
                  finishes redeploying.
                </span>
              </div>
            )}

            {children}
          </div>
        </div>
      </div>

      <AdminChrome />
    </>
  )
}
