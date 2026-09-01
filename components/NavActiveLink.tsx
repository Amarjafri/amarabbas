'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * NavLink::isActive() from the Laravel model: hash-only links are never
 * "active" (the scroll spy in SiteBehaviour handles those); page links compare
 * their path against the current one, ignoring a trailing slash.
 */
export default function NavActiveLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isHash = href.startsWith('/#') || href.startsWith('#')
  const linkPath = href.split('#')[0] || '/'

  const normalise = (value: string) => value.replace(/\/+$/, '') || '/'
  const active = !isHash && normalise(linkPath) === normalise(pathname)

  return (
    <Link href={href} className={active ? 'active' : ''}>
      {children}
    </Link>
  )
}
