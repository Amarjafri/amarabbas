import type { MetadataRoute } from 'next'

import { getPosts, getProjects } from '@/lib/data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amarabbas.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: siteUrl + '/projects', changeFrequency: 'monthly', priority: 0.9 },
    { url: siteUrl + '/blog', changeFrequency: 'weekly', priority: 0.8 },
  ]

  const projects: MetadataRoute.Sitemap = getProjects().map((project) => ({
    url: siteUrl + '/projects/' + project.slug,
    lastModified: new Date(project.updated_at),
    changeFrequency: 'yearly',
    priority: 0.7,
  }))

  const posts: MetadataRoute.Sitemap = getPosts().map((post) => ({
    url: siteUrl + '/blog/' + post.slug,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  return [...staticPages, ...projects, ...posts]
}
