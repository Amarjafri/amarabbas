import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AdminTitle from '@/components/admin/AdminTitle'
import ProjectForm from '@/components/admin/ProjectForm'
import { storageUrl } from '@/lib/data'
import { readRows } from '@/lib/store'
import type { Project } from '@/lib/types'

export const metadata: Metadata = { title: 'Edit Project — Admin' }
export const dynamic = 'force-dynamic'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const projects = await readRows<Project>('projects')
  const project = projects.find((row) => row.id === Number(id))

  if (!project) notFound()

  return (
    <>
      <AdminTitle>Edit Project</AdminTitle>
      <ProjectForm
        project={project}
        galleryUrls={(project.gallery ?? []).map((path) => ({ path, url: storageUrl(path) }))}
        mainImageUrl={project.image ? storageUrl(project.image) : null}
      />
    </>
  )
}
