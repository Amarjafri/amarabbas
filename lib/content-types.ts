import type { CollectionName } from './types'

/**
 * Port of ContentController::types() — the schema that drives every
 * "Site Content" screen. One entry per repeating block on the public site;
 * the admin list and form views are generated from `fields`.
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'icon'

export interface FieldConfig {
  label: string
  type: FieldType
  required?: boolean
  max?: number
  rows?: number
  placeholder?: string
  hint?: string
  width?: 'half' | 'full'
  default?: boolean
}

export interface ContentTypeConfig {
  key: string
  label: string
  singular: string
  icon: string
  intro: string
  collection: CollectionName
  columns: Record<string, string>
  fields: Record<string, FieldConfig>
}

export const CONTENT_TYPES: Record<string, ContentTypeConfig> = {
  experiences: {
    key: 'experiences',
    label: 'Experience',
    singular: 'Experience',
    icon: 'fas fa-briefcase',
    intro:
      'Your career timeline, shown in the Experience section. Drag order is set by the Sort Order number — lowest first.',
    collection: 'experiences',
    columns: { title: 'Role', company: 'Company', period: 'Period' },
    fields: {
      title: { label: 'Job Title', type: 'text', required: true, max: 150, placeholder: 'Senior Full-Stack Developer', width: 'half' },
      company: { label: 'Company', type: 'text', required: true, max: 150, placeholder: 'Eden Prime', width: 'half' },
      period: { label: 'Period', type: 'text', required: true, max: 100, placeholder: 'Sep 2025 — Present', width: 'half' },
      duration: { label: 'Duration', type: 'text', max: 60, placeholder: '1 yr 5 mos', hint: 'Optional. Leave empty to hide.', width: 'half' },
      location: { label: 'Location', type: 'text', max: 150, placeholder: 'Lahore, Pakistan · On-site' },
      is_current: { label: 'This is my current job', type: 'checkbox', hint: 'Adds the green "Current" badge.' },
      bullets: { label: 'Responsibilities', type: 'textarea', rows: 5, hint: 'One bullet point per line.', placeholder: 'Built scalable web applications with Laravel\nDesigned RESTful APIs' },
      tags: { label: 'Tech Tags', type: 'text', max: 300, hint: 'Comma separated.', placeholder: 'Laravel, Vue.js, MySQL' },
    },
  },

  skills: {
    key: 'skills',
    label: 'Skill Groups',
    singular: 'Skill Group',
    icon: 'fas fa-layer-group',
    intro: 'The cards in the Technical Skills section. Each card is one group of pills.',
    collection: 'skill_groups',
    columns: { title: 'Group', skills: 'Skills' },
    fields: {
      icon: { label: 'Icon Class', type: 'icon', required: true, max: 80, placeholder: 'fas fa-code', width: 'half' },
      title: { label: 'Group Title', type: 'text', required: true, max: 120, placeholder: 'Languages & Frameworks', width: 'half' },
      skills: { label: 'Skills', type: 'textarea', rows: 3, hint: 'Comma separated — each becomes a pill.', placeholder: 'PHP, Laravel, Vue.js, JavaScript' },
    },
  },

  tech: {
    key: 'tech',
    label: 'Tech Stack',
    singular: 'Tech Item',
    icon: 'fas fa-microchip',
    intro: 'Icons inside the tech-stack card in the About section.',
    collection: 'tech_items',
    columns: { label: 'Technology', icon: 'Icon' },
    fields: {
      icon: { label: 'Icon Class', type: 'icon', required: true, max: 80, placeholder: 'fab fa-laravel', width: 'half' },
      label: { label: 'Label', type: 'text', required: true, max: 80, placeholder: 'Laravel', width: 'half' },
    },
  },

  highlights: {
    key: 'highlights',
    label: 'About Highlights',
    singular: 'Highlight',
    icon: 'fas fa-award',
    intro: 'The icon rows under your About text — education, location, availability, languages.',
    collection: 'highlights',
    columns: { title: 'Title', subtitle: 'Subtitle' },
    fields: {
      icon: { label: 'Icon Class', type: 'icon', required: true, max: 80, placeholder: 'fas fa-graduation-cap', width: 'half' },
      title: { label: 'Title', type: 'text', required: true, max: 120, placeholder: 'BSCS Graduate', width: 'half' },
      subtitle: { label: 'Subtitle', type: 'text', max: 200, placeholder: 'NCBA&E, Multan — 2023' },
    },
  },

  stats: {
    key: 'stats',
    label: 'Hero Stats',
    singular: 'Stat',
    icon: 'fas fa-chart-simple',
    intro:
      'The counters under your hero text. They also appear as the summary row in the About section.',
    collection: 'hero_stats',
    columns: { number: 'Number', label: 'Label' },
    fields: {
      number: { label: 'Number', type: 'text', required: true, max: 20, placeholder: '3+', width: 'half' },
      label: { label: 'Label', type: 'text', required: true, max: 80, placeholder: 'Years Experience', width: 'half' },
      short_label: { label: 'Short Label', type: 'text', max: 40, placeholder: 'Years', hint: 'Used in the compact About row. Falls back to the full label.' },
    },
  },

  menu: {
    key: 'menu',
    label: 'Menu Links',
    singular: 'Menu Link',
    icon: 'fas fa-bars',
    intro:
      'Header, mobile and footer navigation. Use "/" for home, "#about" for a homepage section, or "/blog" for a page.',
    collection: 'nav_links',
    columns: { label: 'Label', url: 'URL' },
    fields: {
      label: { label: 'Label', type: 'text', required: true, max: 60, placeholder: 'About', width: 'half' },
      url: { label: 'URL', type: 'text', required: true, max: 255, placeholder: '#about', width: 'half', hint: '"/", "#about", "/projects" or a full https:// link.' },
      in_header: { label: 'Show in header menu', type: 'checkbox', default: true },
      in_footer: { label: 'Show in footer navigation', type: 'checkbox' },
    },
  },

  social: {
    key: 'social',
    label: 'Contact & Social',
    singular: 'Link',
    icon: 'fas fa-share-nodes',
    intro:
      'Contact cards on the homepage, the footer "Connect" list and the round social buttons.',
    collection: 'social_links',
    columns: { label: 'Label', value: 'Displayed Value' },
    fields: {
      icon: { label: 'Icon Class', type: 'icon', required: true, max: 80, placeholder: 'fas fa-envelope', width: 'half' },
      label: { label: 'Label', type: 'text', required: true, max: 80, placeholder: 'Email', width: 'half' },
      value: { label: 'Displayed Text', type: 'text', max: 200, placeholder: 'you@example.com', hint: 'What visitors see on the contact card.' },
      url: { label: 'Link', type: 'text', required: true, max: 255, placeholder: 'mailto:you@example.com', hint: 'mailto:…, tel:…, https://wa.me/… or any URL.' },
      in_contact: { label: 'Show as contact card on homepage', type: 'checkbox', default: true },
      in_footer: { label: 'Show in footer "Connect" list', type: 'checkbox', default: true },
      is_social_btn: { label: 'Show as round social button in footer', type: 'checkbox' },
    },
  },
}

/** Every type, for the admin sidebar. */
export function contentMenu() {
  return Object.values(CONTENT_TYPES).map(({ key, label, icon }) => ({ key, label, icon }))
}

export function contentType(type: string): ContentTypeConfig | undefined {
  return CONTENT_TYPES[type]
}
