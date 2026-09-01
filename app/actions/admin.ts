'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { contentType } from '@/lib/content-types'
import { readObject, readRows, StoreError, writeCollection } from '@/lib/store'
import type {
  BlogPost,
  CollectionName,
  Project,
  Settings,
  Testimonial,
} from '@/lib/types'
import { removeImage, storeDocument, storeImage, UploadError } from '@/lib/upload'

export interface ActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, '.000Z')
}

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

/**
 * Laravel's `Str::slug($title) . '-' . time()`. Only ever called when creating
 * a record — regenerating on edit would break every existing URL.
 */
function makeSlug(title: string): string {
  const base = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${base || 'item'}-${Math.floor(Date.now() / 1000)}`
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function nullableText(formData: FormData, key: string): string | null {
  const value = text(formData, key)
  return value === '' ? null : value
}

function bool(formData: FormData, key: string): boolean {
  return ['1', 'on', 'true', 'yes'].includes(String(formData.get(key) ?? ''))
}

function int(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? Math.trunc(value) : fallback
}

function file(formData: FormData, key: string): File | null {
  const value = formData.get(key)
  return value instanceof File && value.size > 0 ? value : null
}

/** Turns a thrown store/upload problem into a message the panel can render. */
function toMessage(error: unknown): string {
  if (error instanceof StoreError || error instanceof UploadError) return error.message
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

/**
 * Refreshes the routes a content change can affect. Every public page reads
 * bundled JSON, so in production the real refresh is the redeploy the commit
 * triggers — this keeps the dev server honest and clears the cache either way.
 */
function revalidateSite(...paths: string[]) {
  revalidatePath('/', 'layout')
  paths.forEach((path) => revalidatePath(path))
}

// ── Settings ───────────────────────────────────────────────────────────────

/**
 * The settings screen posts one tab at a time, so only the keys present in the
 * request are written — exactly as AdminController@updateSettings did.
 */
export async function saveSettings(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const settings = await readObject<Settings>('settings')
    const tab = text(formData, 'tab') || 'profile'

    for (const [key, value] of formData.entries()) {
      if (key === 'tab' || value instanceof File) continue
      settings[key] = String(value)
    }

    await writeCollection('settings', settings, `Update ${tab} settings`)
    revalidateSite('/', '/projects', '/blog')

    return { status: 'success', message: 'Settings saved — your site is updated.' }
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }
}

export async function uploadProfilePhoto(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const photo = file(formData, 'photo')
    if (!photo) return { status: 'error', message: 'Choose an image first.' }

    const settings = await readObject<Settings>('settings')
    const previous = settings.profile_image

    settings.profile_image = await storeImage(photo, 'profile')
    await writeCollection('settings', settings, 'Update profile photo')
    await removeImage(previous)

    revalidateSite('/')
    return { status: 'success', message: 'Profile photo updated!' }
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }
}

export async function uploadCv(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const cv = file(formData, 'cv')
    if (!cv) return { status: 'error', message: 'Choose a CV file first.' }

    const settings = await readObject<Settings>('settings')
    const previous = settings.cv_file

    settings.cv_file = await storeDocument(cv)
    await writeCollection('settings', settings, 'Upload CV')
    await removeImage(previous)

    revalidateSite('/')
    return {
      status: 'success',
      message: 'CV uploaded — the download button now serves the new file.',
    }
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }
}

export async function deleteCv(): Promise<void> {
  const settings = await readObject<Settings>('settings')
  const previous = settings.cv_file

  settings.cv_file = ''
  await writeCollection('settings', settings, 'Remove CV')
  await removeImage(previous)

  revalidateSite('/')
  redirect('/admin/settings?saved=cv-removed')
}

// ── Projects ───────────────────────────────────────────────────────────────

export async function saveProject(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let destination = '/admin/projects'

  try {
    const projects = await readRows<Project>('projects')
    const id = int(formData, 'id', 0)
    const existing = id ? projects.find((row) => row.id === id) : undefined

    if (id && !existing) return { status: 'error', message: 'That project no longer exists.' }

    const title = text(formData, 'title')
    if (!title) return { status: 'error', message: 'Title is required.' }
    if (!text(formData, 'category')) return { status: 'error', message: 'Category is required.' }
    if (!text(formData, 'description'))
      return { status: 'error', message: 'Description is required.' }
    if (!text(formData, 'tech_stack'))
      return { status: 'error', message: 'Tech stack is required.' }

    // Main image: replace only when a new file was chosen.
    let image = existing?.image ?? null
    const imageFile = file(formData, 'image')
    if (imageFile) {
      const uploaded = await storeImage(imageFile, 'projects')
      await removeImage(image)
      image = uploaded
    }

    // Gallery: drop the ticked ones, then append any new uploads.
    let gallery = [...(existing?.gallery ?? [])]
    const removals = formData.getAll('remove_gallery').map(String)
    const removed = gallery.filter((path) => removals.includes(path))

    if (removed.length) {
      gallery = gallery.filter((path) => !removals.includes(path))
      for (const path of removed) await removeImage(path)
    }

    for (const entry of formData.getAll('gallery')) {
      if (entry instanceof File && entry.size > 0) {
        gallery.push(await storeImage(entry, 'projects/gallery'))
      }
    }

    const record: Project = {
      id: existing?.id ?? nextId(projects),
      title,
      // Never regenerate a slug on edit — the old URL has to keep working.
      slug: existing?.slug ?? makeSlug(title),
      category: text(formData, 'category'),
      project_type: nullableText(formData, 'project_type'),
      description: text(formData, 'description'),
      impact: nullableText(formData, 'impact'),
      challenges: nullableText(formData, 'challenges'),
      tech_stack: text(formData, 'tech_stack'),
      image,
      gallery,
      live_url: nullableText(formData, 'live_url'),
      github_url: nullableText(formData, 'github_url'),
      client_name: nullableText(formData, 'client_name'),
      year: nullableText(formData, 'year'),
      is_featured: bool(formData, 'is_featured'),
      sort_order: int(formData, 'sort_order', existing?.sort_order ?? 0),
      status: text(formData, 'status') || 'completed',
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    }

    const next = existing
      ? projects.map((row) => (row.id === existing.id ? record : row))
      : [...projects, record]

    await writeCollection(
      'projects',
      next,
      existing ? `Update project: ${record.title}` : `Add project: ${record.title}`
    )

    revalidateSite('/', '/projects', `/projects/${record.slug}`)
    destination = `/admin/projects?saved=${existing ? 'updated' : 'created'}`
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }

  redirect(destination)
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = int(formData, 'id', 0)
  const projects = await readRows<Project>('projects')
  const project = projects.find((row) => row.id === id)

  if (project) {
    await writeCollection(
      'projects',
      projects.filter((row) => row.id !== id),
      `Delete project: ${project.title}`
    )

    await removeImage(project.image)
    for (const path of project.gallery ?? []) await removeImage(path)
  }

  revalidateSite('/', '/projects')
  redirect('/admin/projects?saved=deleted')
}

// ── Blog ───────────────────────────────────────────────────────────────────

export async function savePost(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let destination = '/admin/blog'

  try {
    const posts = await readRows<BlogPost>('blog_posts')
    const id = int(formData, 'id', 0)
    const existing = id ? posts.find((row) => row.id === id) : undefined

    if (id && !existing) return { status: 'error', message: 'That post no longer exists.' }

    const title = text(formData, 'title')
    if (!title) return { status: 'error', message: 'Title is required.' }
    if (!text(formData, 'excerpt')) return { status: 'error', message: 'Excerpt is required.' }
    if (!text(formData, 'body')) return { status: 'error', message: 'Body is required.' }
    if (!text(formData, 'category')) return { status: 'error', message: 'Category is required.' }

    let image = existing?.image ?? null
    const imageFile = file(formData, 'image')
    if (imageFile) {
      const uploaded = await storeImage(imageFile, 'blog')
      await removeImage(image)
      image = uploaded
    }

    const record: BlogPost = {
      id: existing?.id ?? nextId(posts),
      title,
      slug: existing?.slug ?? makeSlug(title),
      excerpt: text(formData, 'excerpt'),
      body: text(formData, 'body'),
      category: text(formData, 'category'),
      image,
      published: bool(formData, 'published'),
      read_time: int(formData, 'read_time', existing?.read_time ?? 5) || 5,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    }

    const next = existing
      ? posts.map((row) => (row.id === existing.id ? record : row))
      : [...posts, record]

    await writeCollection(
      'blog_posts',
      next,
      existing ? `Update post: ${record.title}` : `Add post: ${record.title}`
    )

    revalidateSite('/', '/blog', `/blog/${record.slug}`)
    destination = `/admin/blog?saved=${existing ? 'updated' : 'created'}`
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }

  redirect(destination)
}

export async function deletePost(formData: FormData): Promise<void> {
  const id = int(formData, 'id', 0)
  const posts = await readRows<BlogPost>('blog_posts')
  const post = posts.find((row) => row.id === id)

  if (post) {
    await writeCollection(
      'blog_posts',
      posts.filter((row) => row.id !== id),
      `Delete post: ${post.title}`
    )
    await removeImage(post.image)
  }

  revalidateSite('/', '/blog')
  redirect('/admin/blog?saved=deleted')
}

// ── Testimonials ───────────────────────────────────────────────────────────

export async function saveTestimonial(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const rows = await readRows<Testimonial>('testimonials')
    const id = int(formData, 'id', 0)
    const existing = id ? rows.find((row) => row.id === id) : undefined

    const name = text(formData, 'name')
    if (!name) return { status: 'error', message: 'Name is required.' }
    if (!text(formData, 'message')) return { status: 'error', message: 'Message is required.' }

    let avatar = existing?.avatar ?? null
    const avatarFile = file(formData, 'avatar')
    if (avatarFile) {
      const uploaded = await storeImage(avatarFile, 'testimonials')
      await removeImage(avatar)
      avatar = uploaded
    }

    const record: Testimonial = {
      id: existing?.id ?? nextId(rows),
      name,
      position: text(formData, 'position'),
      company: text(formData, 'company'),
      message: text(formData, 'message'),
      rating: int(formData, 'rating', existing?.rating ?? 5) || 5,
      avatar,
      active: formData.has('active') ? bool(formData, 'active') : (existing?.active ?? true),
      sort_order: int(formData, 'sort_order', existing?.sort_order ?? 0),
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    }

    const next = existing
      ? rows.map((row) => (row.id === existing.id ? record : row))
      : [...rows, record]

    await writeCollection(
      'testimonials',
      next,
      existing ? `Update testimonial: ${record.name}` : `Add testimonial: ${record.name}`
    )

    revalidateSite('/')
    return { status: 'success', message: 'Testimonial saved.' }
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  const id = int(formData, 'id', 0)
  const rows = await readRows<Testimonial>('testimonials')
  const row = rows.find((entry) => entry.id === id)

  if (row) {
    await writeCollection(
      'testimonials',
      rows.filter((entry) => entry.id !== id),
      `Delete testimonial: ${row.name}`
    )
    await removeImage(row.avatar)
  }

  revalidateSite('/')
  redirect('/admin/testimonials?saved=deleted')
}

// ── Site content (schema-driven) ───────────────────────────────────────────

type ContentRow = Record<string, unknown> & { id: number; sort_order: number; active: boolean }

export async function saveContentItem(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const type = text(formData, 'type')
  const config = contentType(type)

  if (!config) return { status: 'error', message: `Unknown content type "${type}".` }

  let destination = `/admin/content/${type}`

  try {
    const rows = await readRows<ContentRow>(config.collection)
    const id = int(formData, 'id', 0)
    const existing = id ? rows.find((row) => row.id === id) : undefined

    if (id && !existing) return { status: 'error', message: 'That item no longer exists.' }

    const record: ContentRow = {
      ...(existing ?? {}),
      id: existing?.id ?? nextId(rows),
      sort_order: int(formData, 'sort_order', existing?.sort_order ?? 0),
      active: formData.has('active') ? bool(formData, 'active') : (existing?.active ?? true),
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    }

    for (const [field, spec] of Object.entries(config.fields)) {
      if (spec.type === 'checkbox') {
        record[field] = bool(formData, field)
        continue
      }

      const value = text(formData, field)

      if (spec.required && !value) {
        return { status: 'error', message: `${spec.label} is required.` }
      }

      if (spec.max && value.length > spec.max) {
        return {
          status: 'error',
          message: `${spec.label} may not be longer than ${spec.max} characters.`,
        }
      }

      record[field] = value === '' && !spec.required ? null : value
    }

    const next = existing
      ? rows.map((row) => (row.id === existing.id ? record : row))
      : [...rows, record]

    await writeCollection(
      config.collection,
      next,
      `${existing ? 'Update' : 'Add'} ${config.singular.toLowerCase()}`
    )

    revalidateSite('/')
    destination = `/admin/content/${type}?saved=${existing ? 'updated' : 'created'}`
  } catch (error) {
    return { status: 'error', message: toMessage(error) }
  }

  redirect(destination)
}

export async function deleteContentItem(formData: FormData): Promise<void> {
  const type = text(formData, 'type')
  const config = contentType(type)
  if (!config) redirect('/admin')

  const id = int(formData, 'id', 0)
  const rows = await readRows<ContentRow>(config.collection)

  await writeCollection(
    config.collection,
    rows.filter((row) => row.id !== id),
    `Delete ${config.singular.toLowerCase()}`
  )

  revalidateSite('/')
  redirect(`/admin/content/${type}?saved=deleted`)
}

/** The eye toggle in the content list — hide a row without deleting it. */
export async function toggleContentItem(formData: FormData): Promise<void> {
  const type = text(formData, 'type')
  const config = contentType(type)
  if (!config) redirect('/admin')

  const id = int(formData, 'id', 0)
  const rows = await readRows<ContentRow>(config.collection)

  await writeCollection(
    config.collection,
    rows.map((row) => (row.id === id ? { ...row, active: !row.active, updated_at: nowIso() } : row)),
    `Toggle ${config.singular.toLowerCase()} visibility`
  )

  revalidateSite('/')
  redirect(`/admin/content/${type}?saved=toggled`)
}

/** Used by the list screens so they never read a stale bundle. */
export async function loadRows<T>(collection: CollectionName): Promise<T[]> {
  return readRows<T>(collection)
}
