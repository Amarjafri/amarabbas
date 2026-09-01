'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Mirrors request()->routeIs(...) / request()->is(...) in the Blade sidebar. */
export default function AdminSidebarLink({
  href,
  exact = false,
  children,
}: {
  href: string
  exact?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link href={href} className={active ? 'active' : ''}>
      {children}
    </Link>
  )
}
