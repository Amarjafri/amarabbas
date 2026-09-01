import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import {
  getProjectCategories,
  getProjects,
  setting,
  slugify,
  splitCommas,
  storageUrl,
  strLimit,
} from '@/lib/data'

export const metadata: Metadata = {
  title: setting('projects_page_meta'),
  description: setting('projects_page_desc'),
  openGraph: {
    title: setting('projects_page_meta'),
    description: setting('projects_page_desc'),
  },
}

/** Ported from resources/views/projects/index.blade.php. */
export default function ProjectsPage() {
  const projects = getProjects()
  const categories = getProjectCategories()

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="page-hero-content">
            <div className="section-tag">{setting('projects_page_tag')}</div>
            <h1 className="page-hero-title">{setting('projects_page_title')}</h1>
            <p className="page-hero-desc">{setting('projects_page_desc')}</p>
          </div>
        </div>
      </section>

      <section className="projects-page section-pad">
        <div className="container">
          {/* FILTERS — wired up by initFilters() in components/SiteBehaviour.tsx */}
          <div className="proj-filters reveal" role="group" aria-label="Filter projects by category">
            <button type="button" className="filter-btn active" data-filter="all" aria-pressed="true">
              All Projects
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                className="filter-btn"
                data-filter={slugify(cat)}
                aria-pressed="false"
                key={cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* PROJECTS GRID */}
          <div className="proj-full-grid" id="projectsGrid">
            {projects.map((project) => (
              <article
                className="proj-full-card reveal"
                data-category={slugify(project.category)}
                key={project.id}
              >
                <div className="pfc-img-wrap">
                  {project.image ? (
                    <Image
                      src={storageUrl(project.image)}
                      alt={project.title}
                      className="pfc-img"
                      width={800}
                      height={500}
                      loading="lazy"
                    />
                  ) : (
                    <div className="pfc-img-placeholder">
                      <span>{project.title.substring(0, 2)}</span>
                    </div>
                  )}
                  <div className="pfc-overlay">
                    <Link href={`/projects/${project.slug}`} className="pfc-btn">
                      View Details
                    </Link>
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pfc-btn pfc-btn-outline"
                      >
                        Live Site ↗
                      </a>
                    )}
                  </div>
                  {project.is_featured && <span className="pfc-badge">Featured</span>}
                </div>
                <div className="pfc-info">
                  <span className="pfc-category">{project.category}</span>
                  <h3 className="pfc-title">{project.title}</h3>
                  <p className="pfc-desc">{strLimit(project.description, 110)}</p>
                  {project.impact && <p className="proj-impact">{project.impact}</p>}
                  <div className="pfc-tech">
                    {splitCommas(project.tech_stack)
                      .slice(0, 5)
                      .map((tech, index) => (
                        <span key={index}>{tech}</span>
                      ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Laravel paginated 9 per page; every project fits on one page, so the
              control renders empty — the wrapper is kept for identical spacing. */}
          <div className="pagination-wrap"></div>
        </div>
      </section>
    </>
  )
}
