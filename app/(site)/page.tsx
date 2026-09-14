import { readFileSync } from 'fs'
import path from 'path'

import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import ContactForm from '@/components/ContactForm'
import { formatDate } from '@/lib/format'
import {
  getExperiences,
  getFeaturedProjects,
  getHeroStats,
  getHighlights,
  getLatestPosts,
  getProfile,
  getSkills,
  getSocialLinks,
  getTechItems,
  getTestimonials,
  isExternal,
  setting,
  settingLines,
  settingOn,
  splitCommas,
  splitLines,
  fileUrl,
  storageUrl,
  strLimit,
} from '@/lib/data'
import type { Project } from '@/lib/types'

export const metadata: Metadata = {
  title: setting('home_title'),
}

/** Stagger for .reveal elements, read by base.css as --d. */
function delay(ms: number): CSSProperties {
  return { '--d': `${ms}ms` } as CSSProperties
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function siteHost(url: string | null) {
  if (!url) return 'private project'
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Width ÷ height of an uploaded image, read from its PNG/JPEG header. The page
 * is prerendered, so this runs at build time only. Remote (Blob) images return
 * null and are shown as-is.
 */
function imageRatio(src: string): number | null {
  if (!src.startsWith('/storage/') && !src.startsWith('/uploads/')) return null

  try {
    const buf = readFileSync(path.join(process.cwd(), 'public', src))

    if (buf[0] === 0x89) return buf.readUInt32BE(16) / buf.readUInt32BE(20)

    for (let i = 2; i < buf.length - 9; ) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xc3) return buf.readUInt16BE(i + 7) / buf.readUInt16BE(i + 5)
      i += 2 + buf.readUInt16BE(i + 2)
    }
  } catch {
    // Missing or unreadable file — fall through to the stored image as-is.
  }

  return null
}

/**
 * A very wide capture turns into a blurry zoom inside a 16:10 frame. Prefer the
 * project's first normally proportioned gallery screenshot in that case.
 */
function frameImage(project: Project): string | null {
  if (!project.image) return null

  const main = storageUrl(project.image)
  const ratio = imageRatio(main)
  if (ratio === null || ratio <= 2.4) return main

  const alternative = (project.gallery ?? [])
    .map(storageUrl)
    .find((src) => {
      const r = imageRatio(src)
      return r !== null && r >= 1.2 && r <= 2.4
    })

  return alternative ?? main
}

function WorkCard({ project, index }: { project: Project; index: number }) {
  const href = `/projects/${project.slug}`
  const stack = splitCommas(project.tech_stack)
  const shown = stack.slice(0, 5)
  const roles = splitCommas(project.role)
  const image = frameImage(project)

  return (
    <article className="work-card reveal" style={delay((index % 2) * 120)}>
      <div className="work-card-inner glass glow-border">
        <Link href={href} className="work-shot" tabIndex={-1} aria-hidden="true">
          <span className="browser-bar">
            <span className="browser-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="browser-url">{siteHost(project.live_url)}</span>
          </span>
          <span className="work-shot-img">
            {image ? (
              <Image
                src={image}
                alt=""
                width={1600}
                height={1000}
                sizes="(max-width: 900px) 100vw, 600px"
                loading="lazy"
              />
            ) : (
              <span className="proj-img-placeholder">{project.title.substring(0, 2)}</span>
            )}
          </span>
          <span className="work-shot-overlay">
            <span className="work-shot-cta">View case study →</span>
          </span>
        </Link>

        <div className="work-card-body">
          <p className="work-card-top">
            <span className="work-num">{pad(index + 1)}</span>
            <span className="work-cat">{project.category}</span>
            {project.year && <span className="work-year">{project.year}</span>}
          </p>

          <h3 className="work-title">
            <Link href={href}>{project.title}</Link>
          </h3>

          <p className="work-desc">{project.summary || strLimit(project.description, 200)}</p>

          <ul className="work-stack" aria-label="Tech stack">
            {shown.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
            {stack.length > shown.length && (
              <li className="work-stack-more">+{stack.length - shown.length}</li>
            )}
          </ul>

          {roles.length > 0 && (
            <p className="work-role">
              <span>Role</span>
              {roles.join(' · ')}
            </p>
          )}

          {/* Only ever a real, verifiable outcome — set in the admin panel. */}
          {project.impact && <p className="proj-impact">{project.impact}</p>}

          <div className="work-links">
            <Link href={href} className="btn-primary btn-sm">
              View Project <span className="arrow" aria-hidden="true">→</span>
            </Link>
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm link-quiet"
              >
                Live Site <span className="arrow" aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const profile = getProfile()
  const heroStats = getHeroStats()
  const highlights = getHighlights()
  const techItems = getTechItems()
  const experiences = getExperiences()
  const featuredProjects = getFeaturedProjects()
  const skillGroups = getSkills()
  const testimonials = getTestimonials()
  const latestPosts = getLatestPosts()
  const contactLinks = getSocialLinks().filter((link) => link.in_contact)
  const typingWords = settingLines('hero_rotate_words')

  // Floating chips around the photo — the core stack, taken from Tech Stack.
  const chipLabels = ['Laravel', 'MySQL', 'REST APIs']
  const chips = chipLabels
    .map((label) => techItems.find((tech) => tech.label === label))
    .filter((tech): tech is NonNullable<typeof tech> => Boolean(tech))

  // Uploaded files carry a timestamp in their name — hand the visitor a clean one.
  const cvFile = setting('cv_file')
  const cvExt = cvFile.split('.').pop() || 'pdf'
  const cvAs = `${(profile.name || 'cv').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cv.${cvExt}`

  return (
    <>
      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      {settingOn('hero_show') && (
        <section className="hero" id="hero">
          <div className="hero-inner">
            <div className="hero-content">
              {settingOn('hero_badge_show') && setting('hero_badge_text') && (
                <span className="hero-badge reveal" style={delay(0)}>
                  <span className="badge-dot" aria-hidden="true"></span>
                  {setting('hero_badge_text')}
                </span>
              )}

              {setting('hero_eyebrow') && (
                <span className="hero-eyebrow reveal" style={delay(80)}>
                  {setting('hero_eyebrow')}
                </span>
              )}

              <h1
                className="hero-title reveal"
                style={delay(160)}
                dangerouslySetInnerHTML={{ __html: setting('hero_title') }}
              />

              {typingWords.length > 0 && (
                <p className="hero-typing reveal" style={delay(240)}>
                  <span className="type-prefix">Building</span>{' '}
                  <span className="type-words" data-words={JSON.stringify(typingWords)} aria-hidden="true">
                    <span className="type-text">{typingWords[0]}</span>
                    <span className="type-caret"></span>
                  </span>
                  <span className="sr-only">{typingWords.join(', ')}</span>
                </p>
              )}

              <p
                className="hero-desc reveal"
                style={delay(320)}
                dangerouslySetInnerHTML={{ __html: setting('hero_desc') }}
              />

              <div className="hero-actions reveal" style={delay(400)}>
                {setting('hero_btn1_label') && (
                  <a href="#projects-home" className="btn-primary">
                    {setting('hero_btn1_label')} <span className="arrow" aria-hidden="true">→</span>
                  </a>
                )}

                {setting('hero_btn2_label') && cvFile && (
                  <a href={fileUrl(cvFile)} download={cvAs} className="btn-ghost">
                    {setting('hero_btn2_label')} <span aria-hidden="true">↓</span>
                  </a>
                )}

                {setting('hero_btn3_label') && (
                  <a href="#contact" className="btn-link">
                    {setting('hero_btn3_label')}
                  </a>
                )}
              </div>

              {settingOn('hero_stats_show') && heroStats.length > 0 && (
                <div className="hero-stats reveal" style={delay(480)}>
                  {heroStats.map((stat) => (
                    <div className="stat glass" key={stat.id}>
                      <span className="stat-n gradient-text">{stat.number}</span>
                      <span className="stat-l">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hero-visual reveal reveal-zoom" style={delay(220)}>
              <div className="photo-ring">
                <div className="photo-frame">
                  {profile.profileImage ? (
                    <Image
                      src={storageUrl(profile.profileImage)}
                      alt={profile.name}
                      className="profile-photo"
                      width={380}
                      height={475}
                      priority
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <span>{setting('initials')}</span>
                    </div>
                  )}
                </div>
              </div>

              {chips.map((tech, index) => (
                <span className={`float-chip chip-${index + 1}`} key={tech.id} aria-hidden="true">
                  <i className={tech.icon}></i>
                  {tech.label}
                </span>
              ))}
            </div>
          </div>

          <a href="#about" className="scroll-cue" aria-label="Scroll to About">
            <span></span>
          </a>
        </section>
      )}

      {/* ═══════════════════════════════ TECH MARQUEE ═══════════════════════════════ */}
      {techItems.length > 0 && (
        <div className="tech-marquee" role="region" aria-label="Technologies I work with">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <ul className="marquee-group" aria-hidden={copy === 1 ? true : undefined} key={copy}>
                {techItems.map((tech) => (
                  <li key={tech.id}>
                    <i className={tech.icon} aria-hidden="true"></i>
                    {tech.label}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ ABOUT ═══════════════════════════════ */}
      {settingOn('about_show') && (
        <section className="about section-pad" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-left reveal reveal-left">
                <div className="section-tag">{setting('about_tag')}</div>
                <h2
                  className="section-title"
                  dangerouslySetInnerHTML={{ __html: setting('about_title') }}
                />

                {setting('about_text_1') && (
                  <p dangerouslySetInnerHTML={{ __html: setting('about_text_1') }} />
                )}
                {setting('about_text_2') && (
                  <p dangerouslySetInnerHTML={{ __html: setting('about_text_2') }} />
                )}

                {highlights.length > 0 && (
                  <div className="about-highlights">
                    {highlights.map((highlight) => (
                      <div className="highlight-item" key={highlight.id}>
                        <span className="hi-icon">
                          <i className={highlight.icon} aria-hidden="true"></i>
                        </span>
                        <div className="hi-text">
                          <strong>{highlight.title}</strong>
                          {highlight.subtitle && <small>{highlight.subtitle}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {setting('about_btn_label') && (
                  <a href="#contact" className="btn-primary">
                    {setting('about_btn_label')} <span className="arrow" aria-hidden="true">→</span>
                  </a>
                )}
              </div>

              <div className="about-right reveal reveal-right" style={delay(150)}>
                {techItems.length > 0 && (
                  <div className="tech-card glass glow-border">
                    <div className="tech-card-header">
                      <span className="tc-dot tc-red"></span>
                      <span className="tc-dot tc-yellow"></span>
                      <span className="tc-dot tc-green"></span>
                      <span className="tc-title">{setting('about_card_title')}</span>
                    </div>

                    <div className="tech-card-body">
                      <div className="tech-grid">
                        {techItems.map((tech) => (
                          <div className="tech-item" key={tech.id}>
                            <i className={tech.icon} aria-hidden="true"></i>
                            <small>{tech.label}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {heroStats.length > 0 && (
                  <div className="exp-summary-cards">
                    {heroStats.map((stat) => (
                      <div className="esc-item glass" key={stat.id}>
                        <span className="esc-n gradient-text">{stat.number}</span>
                        <span className="esc-l">{stat.short_label || stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ EXPERIENCE ═══════════════════════════════ */}
      {settingOn('exp_show') && experiences.length > 0 && (
        <section className="experience section-pad" id="experience">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-tag">{setting('exp_tag')}</div>
              <h2 className="section-title">{setting('exp_title')}</h2>
              <p className="section-sub">{setting('exp_sub')}</p>
            </div>

            <ol className="timeline">
              {experiences.map((exp, index) => {
                const bullets = splitLines(exp.bullets)
                const tags = splitCommas(exp.tags)
                const side = index % 2 === 0 ? 'left' : 'right'

                return (
                  <li
                    className={`tl-item tl-${side}${exp.is_current ? ' is-current' : ''} reveal reveal-${side}`}
                    key={exp.id}
                  >
                    <span className="tl-node" aria-hidden="true"></span>

                    <article className="tl-card glass glow-border">
                      <div className="tl-top">
                        <span className="tl-period">{exp.period}</span>
                        {exp.is_current ? (
                          <span className="tl-now">
                            <span className="badge-dot" aria-hidden="true"></span>
                            Current
                          </span>
                        ) : (
                          exp.duration && <span className="tl-duration">{exp.duration}</span>
                        )}
                      </div>

                      <h3 className="tl-role">{exp.title}</h3>
                      <p className="tl-company">{exp.company}</p>

                      {exp.location && (
                        <p className="tl-location">
                          <i className="fas fa-location-dot" aria-hidden="true"></i> {exp.location}
                        </p>
                      )}

                      {bullets.length > 0 && (
                        <ul className="tl-bullets">
                          {bullets.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      )}

                      {tags.length > 0 && (
                        <div className="tl-tags">
                          {tags.map((tag) => (
                            <span className="tl-tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ SELECTED WORK ═══════════════════════════════ */}
      {settingOn('projects_show') && featuredProjects.length > 0 && (
        <section className="projects-home section-pad" id="projects-home">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-tag">{setting('projects_tag')}</div>
              <h2 className="section-title">{setting('projects_title')}</h2>
              {setting('projects_sub') && <p className="section-sub">{setting('projects_sub')}</p>}
            </div>

            <div className="work-list">
              {featuredProjects.map((project, index) => (
                <WorkCard project={project} index={index} key={project.id} />
              ))}
            </div>

            {setting('projects_btn') && (
              <div className="section-cta reveal">
                <Link href="/projects" className="btn-ghost">
                  {setting('projects_btn')} <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ SKILLS ═══════════════════════════════ */}
      {settingOn('skills_show') && skillGroups.length > 0 && (
        <section className="skills section-pad" id="skills">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-tag">{setting('skills_tag')}</div>
              <h2 className="section-title">{setting('skills_title')}</h2>
              <p className="section-sub">{setting('skills_sub')}</p>
            </div>

            <div className="skills-grid">
              {skillGroups.map((group, index) => {
                const skills = splitCommas(group.skills)

                return (
                  <div className="skill-wrap reveal" style={delay(index * 120)} key={group.id}>
                    <div className={`skill-card glass glow-border${index === 0 ? ' is-core' : ''}`}>
                      <div className="skill-head">
                        <span className="skill-icon">
                          <i className={group.icon} aria-hidden="true"></i>
                        </span>
                        <h3 className="skill-group-title">{group.title}</h3>
                        <span className="skill-count">{skills.length} skills</span>
                      </div>
                      <ul className="skill-list">
                        {skills.map((skill) => (
                          <li className="skill-pill" key={skill}>
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ TESTIMONIALS ═══════════════════════════════ */}
      {settingOn('testi_show') && testimonials.length > 0 && (
        <section className="testimonials section-pad" id="testimonials">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-tag">{setting('testi_tag')}</div>
              <h2 className="section-title">{setting('testi_title')}</h2>
              <p className="section-sub">{setting('testi_sub')}</p>
            </div>

            {/* Star rows removed: five identical 5-star ratings read as fabricated and
                cost more trust than they buy. Company and role carry the credibility. */}
            <div className="testi-grid">
              {testimonials.map((t) => (
                <figure className="testi-card reveal" key={t.id}>
                  <div className="testi-quote" aria-hidden="true">
                    &ldquo;
                  </div>
                  <blockquote className="testi-text">{t.message}</blockquote>
                  <figcaption className="testi-author">
                    <div>
                      <strong>{t.name}</strong>
                      <small>
                        {t.position} · {t.company}
                      </small>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ BLOG ═══════════════════════════════ */}
      {settingOn('blog_show') && latestPosts.length > 0 && (
        <section className="blog-preview section-pad" id="blog">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-tag">{setting('blog_tag')}</div>
              <h2 className="section-title">{setting('blog_title')}</h2>
              <p className="section-sub">{setting('blog_sub')}</p>
            </div>

            <div className="blog-list">
              {latestPosts.map((post, index) => (
                <Link
                  href={`/blog/${post.slug}`}
                  className="blog-row reveal"
                  style={delay(index * 100)}
                  key={post.id}
                >
                  <span className="blog-row-date">{formatDate(post.created_at, 'd M Y')}</span>

                  <span className="blog-row-main">
                    <span className="blog-row-title">{post.title}</span>
                    <span className="blog-row-excerpt">{strLimit(post.excerpt, 120)}</span>
                  </span>

                  <span className="blog-row-meta">
                    {post.read_time ?? 5} min read <span className="arrow" aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>

            {setting('blog_btn') && (
              <div className="section-cta reveal">
                <Link href="/blog" className="btn-ghost">
                  {setting('blog_btn')} <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ CONTACT ═══════════════════════════════ */}
      {settingOn('contact_show') && (
        <section className="contact section-pad" id="contact">
          <div className="container">
            <div className="contact-panel glow-border reveal reveal-zoom">
              <span className="contact-orb" aria-hidden="true"></span>

              <div className="contact-grid">
                <div className="contact-info">
                  <div className="section-tag">{setting('contact_tag')}</div>
                  <h2
                    className="section-title"
                    dangerouslySetInnerHTML={{ __html: setting('contact_title') }}
                  />
                  <p>{setting('contact_text')}</p>

                  {contactLinks.length > 0 && (
                    <div className="contact-items">
                      {contactLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          {...(isExternal(link.url)
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                          className="contact-item"
                        >
                          <span className="ci-icon">
                            <i className={link.icon} aria-hidden="true"></i>
                          </span>
                          <span className="ci-text">
                            <strong>{link.label}</strong>
                            <span className="ci-value">{link.value}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="contact-form-wrap">
                  <ContactForm
                    projectTypes={settingLines('contact_project_types')}
                    successMessage={setting('contact_success_msg')}
                    submitLabel={setting('contact_btn_label')}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
