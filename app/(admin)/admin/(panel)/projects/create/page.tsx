import type { Metadata } from 'next'

import AdminTitle from '@/components/admin/AdminTitle'
import ProjectForm from '@/components/admin/ProjectForm'

export const metadata: Metadata = { title: 'Add New Project — Admin' }

export default function CreateProjectPage() {
  return (
    <>
      <AdminTitle>Add New Project</AdminTitle>
      <ProjectForm project={null} galleryUrls={[]} mainImageUrl={null} />
    </>
  )
}
