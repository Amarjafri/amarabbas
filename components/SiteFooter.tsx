import Link from 'next/link'
import { Fragment } from 'react'

import { getNavLinks, getSocialLinks, isExternal, navHref, setting, settingLines } from '@/lib/data'

/** Ported verbatim from the footer block in layouts/app.blade.php. */
export default function SiteFooter() {
  const navLinks = getNavLinks()
  const socialLinks = getSocialLinks()

  const footerLinks = navLinks.filter((link) => link.in_footer)
  const footerSocial = socialLinks.filter((link) => link.in_footer)
  const socialBtns = socialLinks.filter((link) => link.is_social_btn)
  const brandLines = settingLines('footer_brand_desc')

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-text">{setting('nav_logo')}</span>
          <span className="logo-dot"></span>
          <p>
            {brandLines.map((line, index) => (
              <Fragment key={index}>
                {line}
                {index < brandLines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        </div>

        {footerLinks.length > 0 && (
          <div className="footer-links">
            <h4>{setting('footer_nav_title')}</h4>
            <ul>
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <Link href={navHref(link.url)}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {footerSocial.length > 0 && (
          <div className="footer-links">
            <h4>{setting('footer_connect_title')}</h4>
            <ul>
              {footerSocial.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    {...(isExternal(link.url)
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="footer-contact">
          <h4>{setting('footer_location_title')}</h4>
          <p>{setting('location')}</p>
          <p>{setting('footer_availability')}</p>

          {socialBtns.length > 0 && (
            <div className="footer-social">
              {socialBtns.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  {...(isExternal(link.url)
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="social-btn"
                  aria-label={link.label}
                >
                  <i className={link.icon} aria-hidden="true"></i>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {setting('footer_copyright')}
        </p>
      </div>
    </footer>
  )
}
