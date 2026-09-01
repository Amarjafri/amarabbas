'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * The inline <script> from layouts/admin.blade.php: theme toggle, mobile
 * sidebar drawer, file-input preview and confirm-on-submit. Same behaviour,
 * same element ids.
 */
export default function AdminChrome() {
  const pathname = usePathname()

  useEffect(() => {
    const cleanups: Array<() => void> = []

    // ── Theme ──
    const themeBtn = document.getElementById('themeToggle')
    if (themeBtn) {
      const onTheme = () => {
        const root = document.documentElement
        let current = root.getAttribute('data-theme')
        if (!current) {
          current = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
        }
        const next = current === 'dark' ? 'light' : 'dark'
        root.setAttribute('data-theme', next)
        try {
          localStorage.setItem('theme', next)
        } catch {
          /* private mode */
        }
      }

      themeBtn.addEventListener('click', onTheme)
      cleanups.push(() => themeBtn.removeEventListener('click', onTheme))
    }

    // ── Sidebar drawer (mobile) ──
    const sidebar = document.getElementById('sidebar')
    const scrim = document.getElementById('sidebarScrim')
    const toggle = document.getElementById('sidebarToggle')

    if (sidebar && scrim && toggle) {
      const closeSidebar = () => {
        sidebar.classList.remove('open')
        scrim.classList.remove('open')
        toggle.setAttribute('aria-expanded', 'false')
      }

      const onToggle = () => {
        const open = sidebar.classList.toggle('open')
        scrim.classList.toggle('open', open)
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
      }

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar()
      }

      toggle.addEventListener('click', onToggle)
      scrim.addEventListener('click', closeSidebar)
      document.addEventListener('keydown', onKeydown)

      cleanups.push(() => {
        toggle.removeEventListener('click', onToggle)
        scrim.removeEventListener('click', closeSidebar)
        document.removeEventListener('keydown', onKeydown)
        closeSidebar()
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])

  // Re-bound per page: these hang off form and input elements the page owns.
  useEffect(() => {
    const cleanups: Array<() => void> = []

    // ── Image upload preview ──
    document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
      const onChange = function (this: HTMLInputElement) {
        const group = this.closest('.form-group')
        const preview = group ? group.querySelector<HTMLImageElement>('.img-preview') : null
        if (preview && this.files?.[0]) {
          const reader = new FileReader()
          reader.onload = (e) => {
            preview.src = String(e.target?.result ?? '')
            preview.style.display = 'block'
          }
          reader.readAsDataURL(this.files[0])
        }
      }

      input.addEventListener('change', onChange)
      cleanups.push(() => input.removeEventListener('change', onChange))
    })

    // ── Confirm destructive actions ──
    document.querySelectorAll<HTMLFormElement>('form[data-confirm]').forEach((form) => {
      const onSubmit = (event: Event) => {
        if (!window.confirm(form.dataset.confirm ?? 'Are you sure?')) event.preventDefault()
      }

      form.addEventListener('submit', onSubmit)
      cleanups.push(() => form.removeEventListener('submit', onSubmit))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [pathname])

  return null
}
