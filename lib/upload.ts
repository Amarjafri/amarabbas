import 'server-only'

/**
 * Where admin uploads go.
 *
 * Production: Vercel Blob, because the app's own filesystem is read-only. The
 * returned public URL is stored in the JSON record as-is, so `storageUrl()`
 * passes it straight through.
 *
 * Development: public/uploads, so the panel works with no token and no network.
 * Those files are gitignored — they are scratch copies, not site content.
 */

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export class UploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadError'
  }
}

/** Laravel stored "projects/xyz.png"; the folder is kept so paths stay readable. */
export type UploadFolder = 'profile' | 'projects' | 'projects/gallery' | 'blog' | 'testimonials'

function randomName(originalName: string): string {
  const ext = (originalName.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const random = Array.from({ length: 20 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
      Math.floor(Math.random() * 62)
    )
  ).join('')

  return `${random}.${ext}`
}

function assertImage(file: File): void {
  if (!file.size) throw new UploadError('That file is empty.')

  if (file.size > MAX_BYTES) {
    throw new UploadError(
      `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 4 MB.`
    )
  }

  if (!ALLOWED.includes(file.type)) {
    throw new UploadError('Only JPG, PNG, WebP, GIF and AVIF images can be uploaded.')
  }
}

/**
 * Stores the file and returns what belongs in the JSON record — an absolute
 * Blob URL in production, or a "folder/name.ext" path in development, matching
 * what the exported MySQL rows already contain.
 */
export async function storeImage(file: File, folder: UploadFolder): Promise<string> {
  assertImage(file)

  const name = randomName(file.name)

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new UploadError(
        'BLOB_READ_WRITE_TOKEN is not set. Create a Blob store in the Vercel dashboard and add ' +
          'the token to Settings → Environment Variables.'
      )
    }

    const { put } = await import('@vercel/blob')

    const blob = await put(`${folder}/${name}`, file, {
      access: 'public',
      contentType: file.type,
    })

    return blob.url
  }

  const { mkdir, writeFile } = await import('fs/promises')
  const path = await import('path')

  const dir = path.join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))

  // Served from /uploads/... — storageUrl() prefixes /storage/, so return the
  // absolute path and let the caller store it verbatim.
  return `/uploads/${folder}/${name}`
}

/** Best-effort cleanup of a file we previously stored. Never throws. */
export async function removeImage(stored: string | null | undefined): Promise<void> {
  if (!stored) return

  try {
    if (stored.startsWith('https://') && stored.includes('.public.blob.vercel-storage.com')) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) return
      const { del } = await import('@vercel/blob')
      await del(stored)
      return
    }

    if (stored.startsWith('/uploads/') && process.env.NODE_ENV !== 'production') {
      const { unlink } = await import('fs/promises')
      const path = await import('path')
      await unlink(path.join(process.cwd(), 'public', stored))
    }

    // Anything else came from the original Laravel export and lives in
    // public/storage as a committed file — leave it alone.
  } catch {
    // A stale file is a smaller problem than a failed save.
  }
}

/** PDF/DOC upload for the CV, which is not an image and has its own limits. */
export async function storeDocument(file: File): Promise<string> {
  const CV_MAX = 5 * 1024 * 1024
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (!file.size) throw new UploadError('That file is empty.')
  if (file.size > CV_MAX) throw new UploadError('The CV must be 5 MB or smaller.')
  if (!allowed.includes(file.type)) throw new UploadError('The CV must be a PDF, DOC or DOCX file.')

  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '')
  const base =
    file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cv'
  const name = `${base}-${Math.floor(Date.now() / 1000)}.${ext}`

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new UploadError('BLOB_READ_WRITE_TOKEN is not set, so the CV cannot be stored.')
    }

    const { put } = await import('@vercel/blob')
    const blob = await put(`files/${name}`, file, { access: 'public', contentType: file.type })
    return blob.url
  }

  const { mkdir, writeFile } = await import('fs/promises')
  const path = await import('path')

  const dir = path.join(process.cwd(), 'public', 'uploads', 'files')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))

  return `/uploads/files/${name}`
}
