import type { Metadata } from 'next'

import AdminTitle from '@/components/admin/AdminTitle'
import PostForm from '@/components/admin/PostForm'

export const metadata: Metadata = { title: 'Write New Post — Admin' }

export default function CreatePostPage() {
  return (
    <>
      <AdminTitle>Write New Post</AdminTitle>
      <PostForm post={null} imageUrl={null} />
    </>
  )
}
