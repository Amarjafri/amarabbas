'use client'

import { useEffect } from 'react'

/**
 * The Blade layout filled its <h1> from @yield('admin-title'). A layout cannot
 * read a child page's data in the App Router, so each page declares its title
 * and this writes it into the topbar heading the layout already renders.
 */
export default function AdminTitle({ children }: { children: string }) {
  useEffect(() => {
    const heading = document.getElementById('adminTitle')
    if (heading) heading.textContent = children
  }, [children])

  return null
}
