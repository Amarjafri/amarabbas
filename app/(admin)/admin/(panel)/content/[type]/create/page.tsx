import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AdminTitle from '@/components/admin/AdminTitle'
import ContentForm from '@/components/admin/ContentForm'
import { contentType } from '@/lib/content-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  return { title: `Add ${contentType(type)?.singular ?? 'item'} — Admin` }
}

export default async function CreateContentPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const config = contentType(type)

  if (!config) notFound()

  return (
    <>
      <AdminTitle>{`Add ${config.singular}`}</AdminTitle>
      <ContentForm config={config} row={null} />
    </>
  )
}
