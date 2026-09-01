/**
 * Read side of the content layer.
 *
 * Public pages import the JSON statically so it is bundled at build time —
 * no filesystem access, no runtime cost, and nothing to break on Vercel's
 * read-only disk. Every admin save commits new JSON to GitHub, which triggers
 * a redeploy, so a static bundle is always current.
 *
 * The admin panel must NOT use this module; it reads through lib/store.ts so
 * it sees values that were just written.
 */

import projectsJson from '@/data/projects.json'
import blogPostsJson from '@/data/blog_posts.json'
import testimonialsJson from '@/data/testimonials.json'
import experiencesJson from '@/data/experiences.json'
import skillGroupsJson from '@/data/skill_groups.json'
import techItemsJson from '@/data/tech_items.json'
import highlightsJson from '@/data/highlights.json'
import heroStatsJson from '@/data/hero_stats.json'
import navLinksJson from '@/data/nav_links.json'
import socialLinksJson from '@/data/social_links.json'
import settingsJson from '@/data/settings.json'

import type {
  BlogPost,
  Experience,
  HeroStat,
  Highlight,
  NavLink,
  Project,
  Settings,
  SkillGroup,
  SocialLink,
  TechItem,
  Testimonial,
} from './types'

const projects = projectsJson as unknown as Project[]
const blogPosts = blogPostsJson as unknown as BlogPost[]
const testimonials = testimonialsJson as unknown as Testimonial[]
const experiences = experiencesJson as unknown as Experience[]
const skillGroups = skillGroupsJson as unknown as SkillGroup[]
const techItems = techItemsJson as unknown as TechItem[]
const highlights = highlightsJson as unknown as Highlight[]
const heroStats = heroStatsJson as unknown as HeroStat[]
const navLinks = navLinksJson as unknown as NavLink[]
const socialLinks = socialLinksJson as unknown as SocialLink[]

// ── Settings ───────────────────────────────────────────────────────────────

export function getSettings(): Settings {
  return settingsJson as Settings
}

/** Laravel's `setting()` helper. */
export function setting(key: string, fallback = ''): string {
  const value = getSettings()[key]
  return value === undefined || value === null || value === '' ? fallback : value
}

/** Laravel's `setting_on()` — visibility toggles; anything unset means visible. */
export function settingOn(key: string, fallback = true): boolean {
  const value = getSettings()[key]
  if (value === undefined || value === null || value === '') return fallback
  return ['1', 'on', 'true', 'yes'].includes(String(value))
}

/** Laravel's `setting_lines()` — a "one per line" textarea as a clean list. */
export function settingLines(key: string): string[] {
  return splitLines(getSettings()[key] ?? '')
}

// ── List splitting (mirrors the Orderable trait's listOf) ──────────────────

export function splitLines(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return []
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function splitCommas(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return []
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

// ── Ordering (matches the Orderable scopes and the controllers) ────────────

/** `active = 1` then `sort_order ASC, id ASC`. */
function live<T extends { active: boolean; sort_order: number; id: number }>(rows: T[]): T[] {
  return rows
    .filter((row) => row.active)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
}

// ── Projects ───────────────────────────────────────────────────────────────

/** ProjectController@index: `sort_order ASC, created_at DESC`. */
export function getProjects(): Project[] {
  return [...projects].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

/** HomeController: featured only, `sort_order ASC`, capped by `projects_limit`. */
export function getFeaturedProjects(): Project[] {
  const limit = Math.max(1, Number(setting('projects_limit', '6')) || 6)

  return projects
    .filter((project) => project.is_featured)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .slice(0, limit)
}

/** Same category, excluding the current project, first 3 — as the controller does. */
export function getRelatedProjects(project: Project): Project[] {
  return projects
    .filter((row) => row.category === project.category && row.id !== project.id)
    .slice(0, 3)
}

export function getProjectCategories(): string[] {
  return [...new Set(getProjects().map((project) => project.category).filter(Boolean))]
}

// ── Blog ───────────────────────────────────────────────────────────────────

/** Published only, newest first. */
export function getPosts(): BlogPost[] {
  return blogPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPosts().find((post) => post.slug === slug)
}

/** HomeController caps the homepage teaser with `blog_limit`. */
export function getLatestPosts(): BlogPost[] {
  const limit = Math.max(1, Number(setting('blog_limit', '3')) || 3)
  return getPosts().slice(0, limit)
}

export function getRelatedPosts(post: BlogPost): BlogPost[] {
  return getPosts()
    .filter((row) => row.category === post.category && row.id !== post.id)
    .slice(0, 3)
}

export function getPostCategories(): string[] {
  return [...new Set(getPosts().map((post) => post.category).filter(Boolean))]
}

// ── Site content ───────────────────────────────────────────────────────────

export function getTestimonials(): Testimonial[] {
  return live(testimonials)
}

export function getExperiences(): Experience[] {
  return live(experiences)
}

export function getSkills(): SkillGroup[] {
  return live(skillGroups)
}

export function getTechItems(): TechItem[] {
  return live(techItems)
}

export function getHighlights(): Highlight[] {
  return live(highlights)
}

export function getHeroStats(): HeroStat[] {
  return live(heroStats)
}

export function getNavLinks(): NavLink[] {
  return live(navLinks)
}

export function getSocialLinks(): SocialLink[] {
  return live(socialLinks)
}

/** Profile block the home page and layout both need. */
export function getProfile() {
  const settings = getSettings()

  return {
    name: settings.name ?? '',
    tagline: settings.tagline ?? '',
    initials: settings.initials ?? '',
    bio: settings.bio ?? '',
    email: settings.email ?? '',
    phone: settings.phone ?? '',
    whatsapp: settings.whatsapp ?? '',
    location: settings.location ?? '',
    github: settings.github ?? '',
    linkedin: settings.linkedin ?? '',
    cvFile: settings.cv_file ?? '',
    profileImage: settings.profile_image ?? '',
  }
}

// ── URL helpers (ported from the NavLink / SocialLink models) ──────────────

/** NavLink::href() — "#about" hangs off the home page so it works everywhere. */
export function navHref(url: string): string {
  const trimmed = (url ?? '').trim()
  if (trimmed === '') return '/'
  if (trimmed.startsWith('#')) return '/' + trimmed
  return trimmed
}

/** SocialLink::isExternal() — mailto:/tel: must not open in a new tab. */
export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test((url ?? '').trim())
}

/**
 * Where an uploaded file lives.
 *
 * Three shapes reach this function: an absolute Vercel Blob URL (admin upload
 * in production), a root-relative "/uploads/…" path (admin upload in dev), and
 * the bare "projects/xyz.png" the MySQL export produced — only the last needs
 * the /storage prefix that the Laravel symlink used to provide.
 */
export function storageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/')) return path
  return '/storage/' + path
}

/** Same resolution for non-image uploads (the CV). */
export function fileUrl(path: string): string {
  return storageUrl(path)
}

/** Laravel's Str::limit — truncate on length, append an ellipsis. */
export function strLimit(value: string | null | undefined, limit: number, end = '...'): string {
  const text = value ?? ''
  if (text.length <= limit) return text
  return text.slice(0, limit).trimEnd() + end
}

/** Laravel's Str::slug — used for the filter `data-category` attributes. */
export function slugify(value: string): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `nl2br(e($text))` — escape first, then turn newlines into <br>. */
export function nl2brEscaped(value: string | null | undefined): string {
  const escaped = (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  return escaped.replace(/(\r\n|\n\r|\n|\r)/g, '<br />$1')
}
