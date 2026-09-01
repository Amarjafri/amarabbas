import 'server-only'

import type { CollectionName } from './types'

/**
 * Write side of the content layer.
 *
 * Vercel's filesystem is read-only and ephemeral, so the admin panel cannot
 * save by writing a file: anything written at runtime fails, or vanishes on the
 * next deploy. Instead a save commits the JSON back to GitHub through the
 * Contents API, which triggers a Vercel redeploy — the change is live in about
 * 40–90 seconds.
 *
 * In development the same functions read and write data/<name>.json directly,
 * so local editing is instant and needs no token.
 *
 * Public pages must never import this module — they use the static imports in
 * lib/data.ts, which are bundled at build time.
 */

const DATA_DIR = 'nextjs/data'

/** Thrown with a message the admin UI can show as-is. */
export class StoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoreError'
  }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function githubConfig() {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'

  if (!token) {
    throw new StoreError(
      'GITHUB_TOKEN is not set. Add a fine-grained personal access token with ' +
        '"Contents: Read and write" on this repository in Vercel → Settings → Environment Variables.'
    )
  }

  if (!repo || !repo.includes('/')) {
    throw new StoreError('GITHUB_REPO must be set to "owner/repo".')
  }

  return { token, repo, branch }
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'amar-abbas-portfolio-admin',
  }
}

function filePath(name: CollectionName): string {
  return `${DATA_DIR}/${name}.json`
}

/** Serialised the same way `php artisan export:json` writes it, for clean diffs. */
function serialise(data: unknown): string {
  return JSON.stringify(data, null, 4) + '\n'
}

// ── Local filesystem (development) ─────────────────────────────────────────

async function readLocal(name: CollectionName): Promise<unknown> {
  const { readFile } = await import('fs/promises')
  const path = await import('path')

  const file = path.join(process.cwd(), 'data', `${name}.json`)

  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return name === 'settings' ? {} : []
    throw new StoreError(`Could not read data/${name}.json: ${(error as Error).message}`)
  }
}

async function writeLocal(name: CollectionName, data: unknown): Promise<void> {
  const { writeFile } = await import('fs/promises')
  const path = await import('path')

  const file = path.join(process.cwd(), 'data', `${name}.json`)

  try {
    await writeFile(file, serialise(data), 'utf8')
  } catch (error) {
    throw new StoreError(`Could not write data/${name}.json: ${(error as Error).message}`)
  }
}

// ── GitHub Contents API (production) ───────────────────────────────────────

interface GithubFile {
  content: unknown
  sha: string
}

/**
 * Fetches the file and its blob sha. The sha is deliberately not cached — an
 * update sent with a stale one is rejected with a 409, so it is always read
 * immediately before a write.
 */
async function readGithub(name: CollectionName): Promise<GithubFile> {
  const { token, repo, branch } = githubConfig()

  const url = `https://api.github.com/repos/${repo}/contents/${filePath(name)}?ref=${encodeURIComponent(branch)}`
  const response = await fetch(url, { headers: githubHeaders(token), cache: 'no-store' })

  if (response.status === 404) {
    throw new StoreError(
      `${filePath(name)} does not exist on branch "${branch}" of ${repo}. ` +
        'Commit the data folder before saving from the admin panel.'
    )
  }

  if (response.status === 401 || response.status === 403) {
    throw new StoreError(
      'GitHub rejected the token. Check that GITHUB_TOKEN is valid and has ' +
        '"Contents: Read and write" permission on ' + repo + '.'
    )
  }

  if (!response.ok) {
    throw new StoreError(`GitHub read failed (${response.status}): ${await response.text()}`)
  }

  const payload = (await response.json()) as { content?: string; sha: string }
  const decoded = Buffer.from(payload.content ?? '', 'base64').toString('utf8')

  return { content: JSON.parse(decoded), sha: payload.sha }
}

async function writeGithub(
  name: CollectionName,
  data: unknown,
  commitMessage: string
): Promise<void> {
  const { token, repo, branch } = githubConfig()

  // Re-read immediately before writing so the sha is never stale.
  const { sha } = await readGithub(name)

  const url = `https://api.github.com/repos/${repo}/contents/${filePath(name)}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(serialise(data), 'utf8').toString('base64'),
      sha,
      branch,
    }),
  })

  if (response.status === 409) {
    throw new StoreError(
      'Someone else saved a change while this page was open. Reload the page and try again.'
    )
  }

  if (response.status === 401 || response.status === 403) {
    throw new StoreError(
      'GitHub rejected the token. Check that GITHUB_TOKEN has "Contents: Read and write" on ' +
        repo +
        '.'
    )
  }

  if (!response.ok) {
    throw new StoreError(`GitHub write failed (${response.status}): ${await response.text()}`)
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function readCollection(name: CollectionName): Promise<unknown> {
  if (!isProduction()) return readLocal(name)
  return (await readGithub(name)).content
}

export async function writeCollection(
  name: CollectionName,
  data: unknown,
  commitMessage: string
): Promise<void> {
  if (!isProduction()) return writeLocal(name, data)
  return writeGithub(name, data, commitMessage)
}

/** Typed convenience wrappers, so callers do not cast at every call site. */
export async function readRows<T>(name: CollectionName): Promise<T[]> {
  const rows = await readCollection(name)
  return Array.isArray(rows) ? (rows as T[]) : []
}

export async function readObject<T extends object>(name: CollectionName): Promise<T> {
  const value = await readCollection(name)
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as T
}

/** True when a save has to travel through GitHub and wait for a redeploy. */
export function savesAreDeferred(): boolean {
  return isProduction()
}
