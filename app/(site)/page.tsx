import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import ContactForm from '@/components/ContactForm'
import { formatDate } from "@/lib/format"
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

export const metadata: Metadata = {
  title: setting('home_title'),
}

/** Ported from resources/views/home/index.blade.php, section for section. */
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
                <span className="hero-badge">
                  <span className="badge-dot"></span>
                  {setting('hero_badge_text')}
                </span>
              )}

              {setting('hero_eyebrow') && (
                <span className="hero-eyebrow">{setting('hero_eyebrow')}</span>
              )}

              <h1
                className="hero-title"
                dangerouslySetInnerHTML={{ __html: setting('hero_title') }}
              />

              <p className="hero-desc" dangerouslySetInnerHTML={{ __html: setting('hero_desc') }} />

              <div className="hero-actions">
                {setting('hero_btn1_label') && (
                  <Link href="/projects" className="btn-primary">
                    {setting('hero_btn1_label')}
                  </Link>
                )}

                {setting('hero_btn2_label') && cvFile && (
                  <a href={fileUrl(cvFile)} download={cvAs} className="btn-ghost">
                    {setting('hero_btn2_label')}
                  </a>
                )}

                {setting('hero_btn3_label') && (
                  <a href="#contact" className="btn-link">
                    {setting('hero_btn3_label')}
                  </a>
                )}
              </div>

              {settingOn('hero_stats_show') && heroStats.length > 0 && (
                <div className="hero-stats">
                  {heroStats.map((stat) => (
                    <div className="stat" key={stat.id}>
                      <span className="stat-n">{stat.number}</span>
                      <span className="stat-l">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hero-photo-wrap">
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
                    <p>
                      Upload your photo
                      <br />
                      in the admin panel
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ ABOUT ═══════════════════════════════ */}
      {settingOn('about_show') && (
        <section className="about section-pad" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-left reveal">
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
                    {setting('about_btn_label')}
                  </a>
                )}
              </div>

              <div className="about-right reveal">
                {techItems.length > 0 && (
                  <div className="tech-card">
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
                      <div className="esc-item" key={stat.id}>
                        <span className="esc-n">{stat.number}</span>
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

            <div className="timeline">
              {experiences.map((exp) => {
                const bullets = splitLines(exp.bullets)
                const tags = splitCommas(exp.tags)

                return (
                  <div
                    className={`tl-item ${exp.is_current ? 'tl-current' : ''} reveal`}
                    key={exp.id}
                  >
                    <div className="tl-when">
                      <span className="tl-period">{exp.period}</span>
                      {exp.duration && <span className="tl-duration">{exp.duration}</span>}
                    </div>

                    <div className="tl-rail" aria-hidden="true">
                      <span className="tl-node"></span>
                    </div>

                    <div className="tl-body">
                      <h3 className="tl-role">{exp.title}</h3>
                      <span className="tl-company">{exp.company}</span>
                      {exp.is_current && <span className="tl-now">Current</span>}

                      {exp.location && (
                        <span className="tl-location">
                          <i className="fas fa-location-dot" aria-hidden="true"></i> {exp.location}
                        </span>
                      )}

                      {bullets.length > 0 && (
                        <ul className="tl-bullets">
                          {bullets.map((bullet, index) => (
                            <li key={index}>{bullet}</li>
                          ))}
                        </ul>
                      )}

                      {tags.length > 0 && (
                        <div className="tl-tags">
                          {tags.map((tag, index) => (
                            <span className="tl-tag" key={index}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ FEATURED PROJECTS ═══════════════════════════════ */}
      {settingOn('projects_show') && featuredProjects.length > 0 && (
        <section className="projects-home section-pad" id="projects-home">
          <div className="container">
            <div className="section-head reveal">
              <div className="section-tag">{setting('projects_tag')}</div>
              <h2 className="section-title">{setting('projects_title')}</h2>
              <p className="section-sub">{setting('projects_sub')}</p>
            </div>

            <div className="proj-grid-home">
              {featuredProjects.map((project, index) => (
                <article
                  className={`proj-card-home ${index === 0 ? 'is-featured' : ''} reveal`}
                  key={project.id}
                >
                  <div className="proj-img-wrap">
                    {project.image ? (
                      <Image
                        src={storageUrl(project.image)}
                        alt={project.title}
                        className="proj-img"
                        width={800}
                        height={500}
                        loading="lazy"
                      />
                    ) : (
                      <div className="proj-img-placeholder">
                        <span>{project.title.substring(0, 2)}</span>
                      </div>
                    )}

                    <div className="proj-overlay">
                      <Link href={`/projects/${project.slug}`} className="proj-view-btn">
                        View Project →
                      </Link>
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="proj-live-btn"
                        >
                          Live ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="proj-info">
                    <span className="proj-category">{project.category}</span>
                    <h3 className="proj-title-card">{project.title}</h3>
                    <p className="proj-excerpt">
                      {strLimit(project.description, index === 0 ? 180 : 100)}
                    </p>

                    {/* One measurable outcome per project. Fill "Impact" in the admin
                        panel — this is what turns a screenshot grid into a case-study grid. */}
                    {project.impact && <p className="proj-impact">{project.impact}</p>}

                    <div className="proj-tech-list">
                      {splitCommas(project.tech_stack)
                        .slice(0, 5)
                        .map((tech, techIndex) => (
                          <span key={techIndex}>{tech}</span>
                        ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {setting('projects_btn') && (
              <div className="section-cta reveal">
                <Link href="/projects" className="btn-outline">
                  {setting('projects_btn')}
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

            {/* Grid, not tabs: recruiters skim and Ctrl-F. Tabs would hide five of six
                categories behind a click and cost you keyword matches. */}
            <div className="skills-grid">
              {skillGroups.map((group) => (
                <div className="skill-card reveal" key={group.id}>
                  <div className="skill-icon">
                    <i className={group.icon} aria-hidden="true"></i>
                  </div>
                  <h3 className="skill-group-title">{group.title}</h3>
                  <div className="skill-pills">
                    {splitCommas(group.skills).map((skill, index) => (
                      <span className="skill-pill" key={index}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
                    {t.avatar ? (
                      <Image
                        src={storageUrl(t.avatar)}
                        alt=""
                        className="testi-avatar"
                        width={96}
                        height={96}
                        loading="lazy"
                      />
                    ) : (
                      <div className="testi-avatar-placeholder" aria-hidden="true">
                        {t.name.substring(0, 1)}
                      </div>
                    )}
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

            {/* A hairline list, not a card grid. Three cards look like an empty shelf;
                three rows look like a deliberate index. */}
            <div className="blog-list reveal">
              {latestPosts.map((post) => (
                <Link href={`/blog/${post.slug}`} className="blog-row" key={post.id}>
                  <span className="blog-row-date">{formatDate(post.created_at, 'd M Y')}</span>

                  <span className="blog-row-main">
                    <span className="blog-row-title">{post.title}</span>
                    <span className="blog-row-excerpt">{strLimit(post.excerpt, 120)}</span>
                  </span>

                  <span className="blog-row-meta">{post.read_time ?? 5} min read →</span>
                </Link>
              ))}
            </div>

            {setting('blog_btn') && (
              <div className="section-cta reveal">
                <Link href="/blog" className="btn-outline">
                  {setting('blog_btn')}
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
            <div className="contact-grid">
              <div className="contact-info reveal">
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

              <div className="contact-form-wrap reveal">
                <ContactForm
                  projectTypes={settingLines('contact_project_types')}
                  successMessage={setting('contact_success_msg')}
                  submitLabel={setting('contact_btn_label')}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
