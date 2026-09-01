import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next 16 writes AGENTS.md/CLAUDE.md into the project root on dev start; this
  // repo documents itself in README.md and NOTES.md instead.
  agentRules: false,

  images: {
    remotePatterns: [
      // Vercel Blob — where admin uploads land in production.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}

export default nextConfig
