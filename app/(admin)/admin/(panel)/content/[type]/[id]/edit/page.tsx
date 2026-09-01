import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AdminTitle from '@/components/admin/AdminTitle'
import ContentForm from '@/components/admin/ContentForm'
import { contentType } from '@/lib/content-types'
import { readRows } from '@/lib/store'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown> & { id: number; sort_order: number; active: boolean }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  return { title: `Edit ${contentType(type)?.singular ?? 'item'} — Admin` }
}

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = await params
  const config = contentType(type)

  if (!config) notFound()

  const rows = await readRows<Row>(config.collection)
  const row = rows.find((entry) => entry.id === Number(id))

  if (!row) notFound()

  return (
    <>
      <AdminTitle>{`Edit ${config.singular}`}</AdminTitle>
      <ContentForm config={config} row={row} />
    </>
  )
}
