import Link from 'next/link'

import { getNavLinks, navHref, setting } from '@/lib/data'
import NavActiveLink from './NavActiveLink'

/**
 * Ported verbatim from resources/views/layouts/app.blade.php — same markup,
 * same classes, same element ids, because public/js/app.js (now
 * components/SiteBehaviour.tsx) finds everything by id.
 */
export default function SiteHeader() {
  const headerLinks = getNavLinks().filter((link) => link.in_header)

  return (
    <>
      <header className="nav-wrap" id="navbar">
        <nav className="nav-inner" aria-label="Primary">
          <Link href="/" className="nav-logo" aria-label={`${setting('name')} — home`}>
            <span className="logo-text">{setting('nav_logo')}</span>
            <span className="logo-dot"></span>
          </Link>

          <ul className="nav-links" id="navLinks">
            {headerLinks.map((link) => (
              <li key={link.id}>
                <NavActiveLink href={navHref(link.url)}>{link.label}</NavActiveLink>
              </li>
            ))}
          </ul>

          <button className="theme-toggle" id="themeToggle" type="button" aria-label="Switch colour theme">
            <i className="fas fa-moon icon-moon" aria-hidden="true"></i>
            <i className="fas fa-sun icon-sun" aria-hidden="true"></i>
          </button>

          <Link href="/#contact" className="nav-hire">
            {setting('nav_hire_label')}
          </Link>

          <button
            className="nav-hamburger"
            id="hamburger"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="mobileOverlay"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </header>

      <div className="mobile-overlay" id="mobileOverlay" aria-hidden="true">
        <button className="mobile-close" id="mobileClose" type="button" aria-label="Close menu">
          ✕
        </button>
        <ul>
          {headerLinks.map((link) => (
            <li key={link.id}>
              <Link href={navHref(link.url)}>{link.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/#contact" className="mobile-hire">
              {setting('nav_hire_label')} →
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
