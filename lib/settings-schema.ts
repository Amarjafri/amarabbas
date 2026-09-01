/**
 * Every editable text on the public site, grouped into tabs.
 * Ported verbatim from the $tabs array in admin/settings.blade.php.
 *
 * "rich" fields are rendered with dangerouslySetInnerHTML on the front end, so
 * basic HTML such as <em> and <strong> works there.
 */

export type SettingFieldType =
  | 'text'
  | 'textarea'
  | 'rich'
  | 'toggle'
  | 'email'
  | 'url'
  | 'number'

export interface SettingField {
  name: string
  label: string
  type: SettingFieldType
  hint?: string
}

export interface SettingTab {
  key: string
  label: string
  icon: string
  fields: SettingField[]
}

function f(name: string, label: string, type: SettingFieldType = 'text', hint?: string): SettingField {
  return { name, label, type, hint }
}

export const SETTING_TABS: SettingTab[] = [
  {
    key: 'profile',
    label: 'Profile',
    icon: 'fas fa-user',
    fields: [
      f('name', 'Full Name'),
      f('tagline', 'Tagline / Role', 'text', 'Shown in the footer and as the default page subtitle.'),
      f('initials', 'Logo Initials', 'text', 'The two letters in the header and footer logo.'),
      f('bio', 'Short Bio', 'textarea', 'Optional. A one-paragraph summary of you.'),
      f('email', 'Email', 'email'),
      f('phone', 'Phone (display)', 'text', 'How the number is printed, e.g. +92 314 616 7055'),
      f('whatsapp', 'WhatsApp Number', 'text', 'Digits only, with country code — used for the wa.me link.'),
      f('location', 'Location'),
      f('github', 'GitHub URL', 'url'),
      f('linkedin', 'LinkedIn URL', 'url'),
      f(
        'cv_file',
        'CV File Path',
        'text',
        'Set automatically when you upload a CV above. Only edit this to point at a file you host yourself.'
      ),
    ],
  },
  {
    key: 'hero',
    label: 'Hero',
    icon: 'fas fa-star',
    fields: [
      f('hero_show', 'Show hero section', 'toggle'),
      f('hero_badge_show', 'Show availability badge', 'toggle'),
      f('hero_badge_text', 'Badge Text'),
      f('hero_eyebrow', 'Eyebrow Line', 'text', 'Small line above the headline.'),
      f('hero_title', 'Headline', 'rich', 'Wrap a word in <em>…</em> to give it the accent style.'),
      f('hero_desc', 'Intro Paragraph', 'rich', '<strong>…</strong> is allowed for emphasis.'),
      f('hero_btn1_label', 'Primary Button Label', 'text', 'Links to the Projects page.'),
      f('hero_btn2_label', 'CV Button Label', 'text', 'Downloads the CV file set under Profile.'),
      f('hero_btn3_label', 'Text Link Label', 'text', 'Scrolls to the contact section.'),
      f('hero_stats_show', 'Show stat counters', 'toggle', 'Edit the numbers under Site Content → Hero Stats.'),
    ],
  },
  {
    key: 'about',
    label: 'About',
    icon: 'fas fa-address-card',
    fields: [
      f('about_show', 'Show about section', 'toggle'),
      f('about_tag', 'Section Tag'),
      f('about_title', 'Section Title', 'rich'),
      f('about_text_1', 'Paragraph 1', 'rich'),
      f('about_text_2', 'Paragraph 2', 'rich'),
      f('about_btn_label', 'Button Label'),
      f('about_card_title', 'Tech Card Title', 'text', 'The filename shown on the tech-stack card.'),
    ],
  },
  {
    key: 'sections',
    label: 'Sections',
    icon: 'fas fa-table-columns',
    fields: [
      f('exp_show', 'Show experience section', 'toggle'),
      f('exp_tag', 'Experience — Tag'),
      f('exp_title', 'Experience — Title'),
      f('exp_sub', 'Experience — Subtitle'),
      f('projects_show', 'Show featured projects', 'toggle'),
      f('projects_tag', 'Projects — Tag'),
      f('projects_title', 'Projects — Title'),
      f('projects_sub', 'Projects — Subtitle'),
      f('projects_btn', 'Projects — Button'),
      f('projects_limit', 'Projects — How many', 'number', 'Featured projects shown on the homepage.'),
      f('skills_show', 'Show skills section', 'toggle'),
      f('skills_tag', 'Skills — Tag'),
      f('skills_title', 'Skills — Title'),
      f('skills_sub', 'Skills — Subtitle'),
      f('testi_show', 'Show testimonials', 'toggle'),
      f('testi_tag', 'Testimonials — Tag'),
      f('testi_title', 'Testimonials — Title'),
      f('testi_sub', 'Testimonials — Subtitle'),
      f('blog_show', 'Show blog teaser', 'toggle'),
      f('blog_tag', 'Blog — Tag'),
      f('blog_title', 'Blog — Title'),
      f('blog_sub', 'Blog — Subtitle'),
      f('blog_btn', 'Blog — Button'),
      f('blog_limit', 'Blog — How many', 'number', 'Latest posts shown on the homepage.'),
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: 'fas fa-envelope',
    fields: [
      f('contact_show', 'Show contact section', 'toggle'),
      f('contact_tag', 'Section Tag'),
      f('contact_title', 'Section Title', 'rich'),
      f('contact_text', 'Intro Paragraph', 'textarea'),
      f('contact_btn_label', 'Submit Button Label'),
      f('contact_success_msg', 'Success Message', 'text', 'Shown after a visitor sends the form.'),
      f('contact_project_types', 'Project Type Options', 'textarea', 'One option per line — these fill the dropdown.'),
    ],
  },
  {
    key: 'pages',
    label: 'Pages',
    icon: 'fas fa-file-lines',
    fields: [
      f('projects_page_tag', 'Projects Page — Tag'),
      f('projects_page_title', 'Projects Page — Title'),
      f('projects_page_desc', 'Projects Page — Intro', 'textarea'),
      f('projects_page_meta', 'Projects Page — Browser Title'),
      f('blog_page_tag', 'Blog Page — Tag'),
      f('blog_page_title', 'Blog Page — Title'),
      f('blog_page_desc', 'Blog Page — Intro', 'textarea'),
      f('blog_page_meta', 'Blog Page — Browser Title'),
      f('author_bio', 'Blog Post — Author Line', 'text', 'Shown in the author box under every article.'),
    ],
  },
  {
    key: 'footer',
    label: 'Header & Footer',
    icon: 'fas fa-shoe-prints',
    fields: [
      f('nav_logo', 'Header Logo Text'),
      f('nav_hire_label', 'Header Button Label'),
      f('footer_brand_desc', 'Footer Brand Blurb', 'textarea', 'One line per row.'),
      f('footer_nav_title', 'Footer — Nav Heading'),
      f('footer_connect_title', 'Footer — Connect Heading'),
      f('footer_location_title', 'Footer — Location Heading'),
      f('footer_availability', 'Availability Line'),
      f('footer_copyright', 'Copyright Line', 'text', 'The year is added automatically.'),
    ],
  },
  {
    key: 'seo',
    label: 'SEO',
    icon: 'fas fa-magnifying-glass',
    fields: [
      f('site_title', 'Default Browser Title'),
      f('home_title', 'Homepage Title'),
      f('meta_description', 'Meta Description', 'textarea', 'Aim for 150–160 characters.'),
      f('meta_keywords', 'Meta Keywords', 'textarea'),
      f('og_description', 'Social Share Text', 'textarea', 'Used when the site is shared on LinkedIn, X, WhatsApp.'),
    ],
  },
]

export function settingTab(key: string): SettingTab {
  return SETTING_TABS.find((tab) => tab.key === key) ?? SETTING_TABS[0]
}
