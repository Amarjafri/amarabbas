/**
 * Shapes mirror the MySQL columns exactly — `php artisan export:json` writes
 * these files straight from the tables, so any rename here would silently
 * break the admin panel's round-trip.
 */

export interface Project {
  id: number
  title: string
  slug: string
  category: string
  project_type: string | null
  description: string
  impact: string | null
  challenges: string | null
  /** Comma-separated in the DB; split at render time. */
  tech_stack: string
  image: string | null
  gallery: string[]
  live_url: string | null
  github_url: string | null
  client_name: string | null
  year: string | null
  is_featured: boolean
  sort_order: number
  status: string
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  body: string
  category: string
  image: string | null
  published: boolean
  read_time: number
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: number
  name: string
  position: string
  company: string
  message: string
  rating: number
  avatar: string | null
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Experience {
  id: number
  title: string
  company: string
  period: string
  duration: string | null
  location: string | null
  is_current: boolean
  /** One bullet per line. */
  bullets: string | null
  /** Comma separated. */
  tags: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface SkillGroup {
  id: number
  icon: string
  title: string
  /** Comma separated — each becomes a pill. */
  skills: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface TechItem {
  id: number
  icon: string
  label: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Highlight {
  id: number
  icon: string
  title: string
  subtitle: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface HeroStat {
  id: number
  number: string
  label: string
  short_label: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface NavLink {
  id: number
  label: string
  url: string
  sort_order: number
  in_header: boolean
  in_footer: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface SocialLink {
  id: number
  icon: string
  label: string
  value: string | null
  url: string
  sort_order: number
  in_contact: boolean
  in_footer: boolean
  is_social_btn: boolean
  active: boolean
  created_at: string
  updated_at: string
}

/** settings is a key/value table, exported as one flat object of strings. */
export type Settings = Record<string, string>

/** Every collection the admin panel can edit, by file name. */
export type CollectionName =
  | 'projects'
  | 'blog_posts'
  | 'testimonials'
  | 'experiences'
  | 'skill_groups'
  | 'tech_items'
  | 'highlights'
  | 'hero_stats'
  | 'nav_links'
  | 'social_links'
  | 'settings'
