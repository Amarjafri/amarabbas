'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * All client-side motion and behaviour for the public site, so every page and
 * section can stay a server component:
 *
 *   window-level (mounted once)  theme toggle, nav state, scroll progress,
 *                                cursor glow, mobile menu
 *   page-level (per route)       scroll spy, reveal, stat count-up, typing
 *                                headline, 3D tilt, smooth anchors, filters
 *
 * Anything animated checks prefers-reduced-motion and falls back to the final
 * state, so the page reads the same with motion switched off.
 */
export default function SiteBehaviour() {
  const pathname = usePathname()

  // ── Mounted once ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanups: Array<() => void> = []
    const root = document.documentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches

    // ── THEME ────────────────────────────────────────────────
    // The inline <head> script already applied a stored choice. Dark is default.
    const toggle = document.getElementById('themeToggle')
    if (toggle) {
      const onToggle = () => {
        const current = root.getAttribute('data-theme') || 'dark'
        const next = current === 'dark' ? 'light' : 'dark'
        root.setAttribute('data-theme', next)

        try {
          localStorage.setItem('theme', next)
        } catch {
          /* private mode — the choice just won't persist */
        }

        toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
      }

      toggle.addEventListener('click', onToggle)
      cleanups.push(() => toggle.removeEventListener('click', onToggle))
    }

    // ── NAV STATE + SCROLL PROGRESS ──────────────────────────
    const navbar = document.getElementById('navbar')
    let scrollTicking = false

    const onScrollFrame = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      root.style.setProperty('--scroll', String(max > 0 ? Math.min(window.scrollY / max, 1) : 0))
      navbar?.classList.toggle('scrolled', window.scrollY > 24)
      scrollTicking = false
    }

    const onScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true
        window.requestAnimationFrame(onScrollFrame)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScrollFrame()
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    })

    // ── CURSOR GLOW (mouse/trackpad only) ────────────────────
    if (finePointer && !reduceMotion) {
      let x = window.innerWidth / 2
      let y = window.innerHeight / 3
      let pending = false

      const paint = () => {
        root.style.setProperty('--mx', `${x}px`)
        root.style.setProperty('--my', `${y}px`)
        pending = false
      }

      const onMove = (event: PointerEvent) => {
        x = event.clientX
        y = event.clientY
        root.classList.add('has-cursor')
        if (!pending) {
          pending = true
          window.requestAnimationFrame(paint)
        }
      }

      const onLeave = () => root.classList.remove('has-cursor')

      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerleave', onLeave)
      })
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
        // Wait a frame: the overlay is not focusable until it has been shown.
        if (closeBtn) window.requestAnimationFrame(() => closeBtn.focus())
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
      closeBtn?.addEventListener('click', close)
      links.forEach((a) => a.addEventListener('click', close))
      document.addEventListener('keydown', onKeydown)

      cleanups.push(() => {
        hamburger.removeEventListener('click', open)
        closeBtn?.removeEventListener('click', close)
        links.forEach((a) => a.removeEventListener('click', close))
        document.removeEventListener('keydown', onKeydown)
        document.body.style.overflow = ''
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])

  // ── Re-run per page ──────────────────────────────────────────────────────
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const cleanups: Array<() => void> = []

    // ── NAV: active section highlight ────────────────────────
    const sections = document.querySelectorAll<HTMLElement>('section[id]')
    const spyLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href*="#"]')

    if (sections.length && spyLinks.length) {
      let ticking = false

      const update = () => {
        let current = ''
        const offset = window.scrollY + 160

        sections.forEach((sec) => {
          if (offset >= sec.offsetTop) current = sec.id
        })

        spyLinks.forEach((a) => {
          const href = a.getAttribute('href') || ''
          a.classList.toggle('active', current !== '' && href.endsWith('#' + current))
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
      update()
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    // ── REVEAL ON SCROLL ─────────────────────────────────────
    // Direction and delay come from CSS (.reveal-left, style="--d: 120ms").
    const revealItems = document.querySelectorAll<HTMLElement>('.reveal')

    if (revealItems.length) {
      if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((el) => el.classList.add('visible'))
      } else {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return
              entry.target.classList.add('visible')
              observer.unobserve(entry.target)
            })
          },
          { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        )

        revealItems.forEach((el) => observer.observe(el))
        cleanups.push(() => observer.disconnect())
      }
    }

    // ── STAT COUNT-UP ────────────────────────────────────────
    // Keeps any non-digit characters ("4+", "100%") around the number.
    const nums = document.querySelectorAll<HTMLElement>('.stat-n, .esc-n')

    if (nums.length && !reduceMotion && 'IntersectionObserver' in window) {
      const frames: number[] = []

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return

            const el = entry.target as HTMLElement
            const text = el.dataset.value || (el.textContent || '').trim()
            el.dataset.value = text
            observer.unobserve(el)

            const match = text.match(/(\d+)/)
            if (!match || match.index === undefined) return

            const target = parseInt(match[1], 10)
            const prefix = text.slice(0, match.index)
            const suffix = text.slice(match.index + match[1].length)
            const duration = 1400
            let start: number | null = null

            const tick = (now: number) => {
              if (start === null) start = now
              const progress = Math.min((now - start) / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 4)
              el.textContent = prefix + Math.round(eased * target) + suffix
              if (progress < 1) frames.push(window.requestAnimationFrame(tick))
            }

            frames.push(window.requestAnimationFrame(tick))
          })
        },
        { threshold: 0.6 }
      )

      nums.forEach((el) => observer.observe(el))
      cleanups.push(() => {
        observer.disconnect()
        frames.forEach((id) => window.cancelAnimationFrame(id))
        nums.forEach((el) => {
          if (el.dataset.value) el.textContent = el.dataset.value
        })
      })
    }

    // ── TYPING HEADLINE ──────────────────────────────────────
    const typers = document.querySelectorAll<HTMLElement>('[data-words]')

    typers.forEach((el) => {
      const output = el.querySelector<HTMLElement>('.type-text')
      let words: string[] = []
      try {
        words = JSON.parse(el.dataset.words || '[]')
      } catch {
        words = []
      }
      if (!output || words.length < 2 || reduceMotion) return

      let word = 0
      let chars = words[0].length
      let deleting = true
      let timer = window.setTimeout(step, 2200)

      function step() {
        const current = words[word]

        if (deleting) {
          chars--
          output!.textContent = current.slice(0, chars)
          if (chars <= 0) {
            deleting = false
            word = (word + 1) % words.length
          }
          timer = window.setTimeout(step, 32)
          return
        }

        const nextWord = words[word]
        chars++
        output!.textContent = nextWord.slice(0, chars)

        if (chars >= nextWord.length) {
          deleting = true
          timer = window.setTimeout(step, 2200)
        } else {
          timer = window.setTimeout(step, 70)
        }
      }

      cleanups.push(() => {
        window.clearTimeout(timer)
        output.textContent = words[0]
      })
    })

    // ── 3D TILT ──────────────────────────────────────────────
    if (finePointer && !reduceMotion) {
      const tiltables = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'))

      tiltables.forEach((el) => {
        const max = Number(el.dataset.tilt) || 8
        let frame = 0

        const onMove = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect()
          const px = (event.clientX - rect.left) / rect.width
          const py = (event.clientY - rect.top) / rect.height

          window.cancelAnimationFrame(frame)
          frame = window.requestAnimationFrame(() => {
            el.style.setProperty('--rx', `${(0.5 - py) * max}deg`)
            el.style.setProperty('--ry', `${(px - 0.5) * max}deg`)
            el.style.setProperty('--gx', `${px * 100}%`)
            el.style.setProperty('--gy', `${py * 100}%`)
            el.classList.add('is-tilting')
          })
        }

        const onLeave = () => {
          window.cancelAnimationFrame(frame)
          el.style.setProperty('--rx', '0deg')
          el.style.setProperty('--ry', '0deg')
          el.classList.remove('is-tilting')
        }

        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        cleanups.push(() => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
          window.cancelAnimationFrame(frame)
        })
      })
    }

    // ── SMOOTH SCROLL for in-page anchors ────────────────────
    // Delegated, in the capture phase, so it runs before next/link. Header links
    // are "/#section": once the URL already ends in that hash the router treats
    // a repeat click as a no-op and nothing scrolls. So on the home page every
    // hash link is scrolled here — on every click, not just the first.
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank') return

      const href = link.getAttribute('href') || ''
      let hash = ''
      if (href.startsWith('#')) hash = href
      else if (href.startsWith('/#') && window.location.pathname === '/') hash = href.slice(1)
      if (hash.length < 2) return

      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      // Keep the URL shareable; pass the router's own state so back/forward still work.
      if (window.location.hash !== hash) history.replaceState(history.state, '', hash)
    }

    document.addEventListener('click', onAnchorClick, true)
    cleanups.push(() => document.removeEventListener('click', onAnchorClick, true))

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
    cleanups.push(() => filterButtons.forEach((btn) => btn.removeEventListener('click', onFilterClick)))

    return () => cleanups.forEach((fn) => fn())
  }, [pathname])

  return null
}
