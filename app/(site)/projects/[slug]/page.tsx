import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import ProjectGallery from '@/components/Lightbox'
import {
  getProjectBySlug,
  getProjects,
  getRelatedProjects,
  nl2brEscaped,
  splitCommas,
  storageUrl,
} from '@/lib/data'

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) return { title: 'Project not found — Amar Abbas' }

  const title = `${project.title} — Amar Abbas`
  const description = project.impact || project.description.slice(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: project.image ? [storageUrl(project.image)] : ['/images/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: project.image ? [storageUrl(project.image)] : ['/images/og-image.jpg'],
    },
  }
}

/** Ported from resources/views/projects/show.blade.php. */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) notFound()

  const related = getRelatedProjects(project)
  const gallery = (project.gallery ?? []).map(storageUrl)
  const status = project.status || 'completed'

  return (
    <>
      <section className="page-hero page-hero-sm">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/projects">Projects</Link> /{' '}
            <span>{project.title}</span>
          </div>
        </div>
      </section>

      <section className="project-detail section-pad">
        <div className="container">
          <div className="pd-grid">
            {/* LEFT: CONTENT */}
            <div className="pd-content">
              <span className="pd-category">{project.category}</span>
              <h1 className="pd-title">{project.title}</h1>
              <p className="pd-type">{project.project_type}</p>

              {project.impact && <p className="proj-impact">{project.impact}</p>}

              {/* MAIN IMAGE */}
              <div className="pd-main-img">
                {project.image ? (
                  <Image
                    src={storageUrl(project.image)}
                    alt={project.title}
                    width={1200}
                    height={700}
                    priority
                  />
                ) : (
                  <div className="pd-img-placeholder">
                    <span>{project.title.substring(0, 2)}</span>
                  </div>
                )}
              </div>

              {/* GALLERY */}
              <ProjectGallery images={gallery} title={project.title} />

              {/* DESCRIPTION */}
              <div className="pd-description">
                <h3>Project Overview</h3>
                <div
                  className="pd-body"
                  dangerouslySetInnerHTML={{ __html: nl2brEscaped(project.description) }}
                />
              </div>

              {project.challenges && (
                <div className="pd-description">
                  <h3>Challenges &amp; Solutions</h3>
                  <div
                    className="pd-body"
                    dangerouslySetInnerHTML={{ __html: nl2brEscaped(project.challenges) }}
                  />
                </div>
              )}
            </div>

            {/* RIGHT: SIDEBAR */}
            <div className="pd-sidebar">
              <div className="pd-info-card">
                <h4>Project Details</h4>
                <div className="pd-info-row">
                  <span>Client</span>
                  <strong>{project.client_name ?? 'Confidential'}</strong>
                </div>
                <div className="pd-info-row">
                  <span>Year</span>
                  <strong>{project.year ?? new Date().getFullYear()}</strong>
                </div>
                <div className="pd-info-row">
                  <span>Category</span>
                  <strong>{project.category}</strong>
                </div>
                <div className="pd-info-row">
                  <span>Status</span>
                  <strong className={`status-${status}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </strong>
                </div>
              </div>

              <div className="pd-info-card">
                <h4>Tech Stack</h4>
                <div className="pd-tech-pills">
                  {splitCommas(project.tech_stack).map((tech, index) => (
                    <span className="pd-tech-pill" key={index}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pd-actions">
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary pd-btn"
                  >
                    Visit Live Site ↗
                  </a>
                )}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost pd-btn"
                  >
                    View on GitHub
                  </a>
                )}
                <Link href="/#contact" className="btn-outline pd-btn">
                  Discuss Similar Project
                </Link>
              </div>
            </div>
          </div>

          {/* RELATED PROJECTS */}
          {related.length > 0 && (
            <div className="related-section">
              <h3 className="related-title">More Projects</h3>
              <div className="related-grid">
                {related.map((r) => (
                  <Link href={`/projects/${r.slug}`} className="related-card" key={r.id}>
                    {r.image ? (
                      <Image
                        src={storageUrl(r.image)}
                        alt={r.title}
                        width={600}
                        height={400}
                        loading="lazy"
                      />
                    ) : (
                      <div className="related-placeholder">{r.title.substring(0, 2)}</div>
                    )}
                    <div className="related-info">
                      <span>{r.category}</span>
                      <strong>{r.title}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
