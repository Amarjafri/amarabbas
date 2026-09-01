import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AdminTitle from '@/components/admin/AdminTitle'
import PostForm from '@/components/admin/PostForm'
import { storageUrl } from '@/lib/data'
import { readRows } from '@/lib/store'
import type { BlogPost } from '@/lib/types'

export const metadata: Metadata = { title: 'Edit Post — Admin' }
export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const posts = await readRows<BlogPost>('blog_posts')
  const post = posts.find((row) => row.id === Number(id))

  if (!post) notFound()

  return (
    <>
      <AdminTitle>Edit Post</AdminTitle>
      <PostForm post={post} imageUrl={post.image ? storageUrl(post.image) : null} />
    </>
  )
}
