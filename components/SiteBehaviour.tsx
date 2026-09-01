'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Port of public/js/app.js.
 *
 * Motion budget is unchanged: reveal-on-scroll, stat count-up, nav state.
 * Everything animated is guarded by prefers-reduced-motion.
 *
 * Split into two effects because Next keeps the layout mounted across client
 * navigations: the header/window wiring runs once, while anything that binds to
 * elements belonging to a page re-runs whenever the route changes.
 */
export default function SiteBehaviour() {
  const pathname = usePathname()

  // ── Mounted once: header and window-level wiring ─────────────────────────
  useEffect(() => {
    const cleanups: Array<() => void> = []

    // ── THEME ────────────────────────────────────────────────
    // The inline <head> script has already applied the stored theme before
    // first paint. This only wires up the toggle.
    const toggle = document.getElementById('themeToggle')
    if (toggle) {
      const onToggle = () => {
        const root = document.documentElement
        let current = root.getAttribute('data-theme')

        // No explicit choice yet — resolve what's actually on screen.
        if (!current) {
          current = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
        }

        const next = current === 'dark' ? 'light' : 'dark'
        root.setAttribute('data-theme', next)

        try {
          localStorage.setItem('theme', next)
        } catch {
          /* private mode — the choice just won't persist */
        }

        toggle.setAttribute(
          'aria-label',
          next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        )
      }

      toggle.addEventListener('click', onToggle)
      cleanups.push(() => toggle.removeEventListener('click', onToggle))
    }

    // ── NAV: background on scroll ────────────────────────────
    const navbar = document.getElementById('navbar')
    if (navbar) {
      let ticking = false

      const update = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 24)
        ticking = false
      }

      const onScroll = () => {
        if (!ticking) {
          ticking = true
          window.requestAnimationFrame(update)
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      update()
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    // ── MOBILE MENU ──────────────────────────────────────────
    const hamburger = document.getElementById('hamburger')
    const overlay = document.getElementById('mobileOverlay')
    const closeBtn = document.getElementById('mobileClose')

    if (hamburger && overlay) {
      const open = () => {
        overlay.classList.add('open')
        overlay.setAttribute('aria-hidden', 'false')
        hamburger.setAttribute('aria-expanded', 'true')
        document.body.style.overflow = 'hidden'
        if (closeBtn) closeBtn.focus()
      }

      const close = () => {
        overlay.classList.remove('open')
        overlay.setAttribute('aria-hidden', 'true')
        hamburger.setAttribute('aria-expanded', 'false')
        document.body.style.overflow = ''
      }

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && overlay.classList.contains('open')) {
          close()
          hamburger.focus()
        }
      }

      const links = Array.from(overlay.querySelectorAll('a'))

      hamburger.addEventListener('click', open)
      if (closeBtn) closeBtn.addEventListener('click', close)
      links.forEach((a) => a.addEventListener('click', close))
      document.addEventListener('keydown', onKeydown)

      cleanups.push(() => {
        hamburger.removeEventListener('click', open)
        if (closeBtn) closeBtn.removeEventListener('click', close)
        links.forEach((a) => a.removeEventListener('click', close))
        document.removeEventListener('keydown', onKeydown)
        document.body.style.overflow = ''
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])

  // ── Re-run per page: anything bound to page-owned elements ───────────────
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups: Array<() => void> = []

    // ── NAV: active section highlight ────────────────────────
    const sections = document.querySelectorAll<HTMLElement>('section[id]')
    const spyLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href*="#"]')

    if (sections.length && spyLinks.length) {
      let ticking = false

      const update = () => {
        let current = ''
        const offset = window.scrollY + 140

        sections.forEach((sec) => {
          if (offset >= sec.offsetTop) current = sec.id
        })

        spyLinks.forEach((a) => {
          const href = a.getAttribute('href') || ''
          a.classList.toggle('active', current !== '' && href.indexOf('#' + current) !== -1)
        })

        ticking = false
      }

      const onScroll = () => {
        if (!ticking) {
          ticking = true
          window.requestAnimationFrame(update)
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    // ── REVEAL ON SCROLL ─────────────────────────────────────
    // Fade + 8px rise, 60ms stagger, fires once per element.
    const revealItems = document.querySelectorAll<HTMLElement>('.reveal')

    if (revealItems.length) {
      if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((el) => el.classList.add('visible'))
      } else {
        const timers: number[] = []

        const observer = new IntersectionObserver(
          (entries) => {
            let shown = 0

            entries.forEach((entry) => {
              if (!entry.isIntersecting) return
              const delay = shown * 60
              shown++
              timers.push(
                window.setTimeout(() => entry.target.classList.add('visible'), delay)
              )
              observer.unobserve(entry.target)
            })
          },
          { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        )

        revealItems.forEach((el) => observer.observe(el))
        cleanups.push(() => {
          observer.disconnect()
          timers.forEach((id) => window.clearTimeout(id))
        })
      }
    }

    // ── STAT COUNT-UP ────────────────────────────────────────
    // Preserves any non-digit characters ("3+", "100%") around the number.
    const nums = document.querySelectorAll<HTMLElement>('.stat-n, .esc-n')

    if (nums.length && !reduceMotion && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return

            const el = entry.target as HTMLElement
            const text = (el.textContent || '').trim()
            const match = text.match(/(\d+)/)
            observer.unobserve(el)
            if (!match || match.index === undefined) return

            const target = parseInt(match[1], 10)
            if (!target) return

            const prefix = text.slice(0, match.index)
            const suffix = text.slice(match.index + match[1].length)
            const duration = 700
            let start: number | null = null

            const tick = (now: number) => {
              if (start === null) start = now
              const progress = Math.min((now - start) / duration, 1)
              // ease-out cubic
              const eased = 1 - Math.pow(1 - progress, 3)
              el.textContent = prefix + Math.round(eased * target) + suffix
              if (progress < 1) window.requestAnimationFrame(tick)
            }

            window.requestAnimationFrame(tick)
          })
        },
        { threshold: 0.5 }
      )

      nums.forEach((el) => observer.observe(el))
      cleanups.push(() => observer.disconnect())
    }

    // ── SMOOTH SCROLL for in-page anchors ────────────────────
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))

    const onAnchorClick = function (this: HTMLAnchorElement, event: Event) {
      const id = this.getAttribute('href')
      if (!id || id === '#') return

      const target = document.querySelector(id)
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      // Keep the URL shareable without triggering a second jump.
      if (history.replaceState) history.replaceState(null, '', id)
    }

    anchors.forEach((a) => a.addEventListener('click', onAnchorClick))
    cleanups.push(() => anchors.forEach((a) => a.removeEventListener('click', onAnchorClick)))

    // ── CATEGORY FILTERS (projects / blog) ───────────────────
    const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-btn'))

    const onFilterClick = (event: Event) => {
      const btn = event.currentTarget as HTMLButtonElement
      const bar = btn.closest('.proj-filters, .blog-filter-bar')
      const scope: ParentNode = bar?.parentNode ?? document

      ;(bar ?? document).querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.remove('active')
        b.setAttribute('aria-pressed', 'false')
      })
      btn.classList.add('active')
      btn.setAttribute('aria-pressed', 'true')

      const filter = btn.dataset.filter
      scope.querySelectorAll<HTMLElement>('[data-category]').forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter
        card.hidden = !match
      })
    }

    filterButtons.forEach((btn) => btn.addEventListener('click', onFilterClick))
    cleanups.push(() =>
      filterButtons.forEach((btn) => btn.removeEventListener('click', onFilterClick))
    )

    return () => cleanups.forEach((fn) => fn())
  }, [pathname])

  return null
}
