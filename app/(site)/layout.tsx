import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google'

import './styles/base.css'
import './styles/home.css'
import './styles/pages.css'
import SiteBehaviour from '@/components/SiteBehaviour'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { setting } from '@/lib/data'

// Self-hosted by next/font instead of fetched from Google at runtime.
// globals.css maps --font-display/-body/-mono onto these variables:
// Space Grotesk for headings, Inter for reading, IBM Plex Mono for metadata.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amarabbas.dev'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: setting('site_title'),
  description: setting('meta_description'),
  keywords: setting('meta_keywords'),
  authors: [{ name: setting('name') }],
  openGraph: {
    type: 'website',
    title: setting('site_title'),
    description: setting('og_description'),
    images: ['/images/og-image.jpg'],
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: setting('site_title'),
    description: setting('og_description'),
    images: ['/images/og-image.jpg'],
  },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1120',
}

/**
 * Applies the stored theme before first paint so there is no flash. Dark is
 * the default; light only applies once chosen with the toggle. Also marks the
 * page as scripted, so reveal effects never hide content when JS is off.
 */
const themeScript = `(function () {
  document.documentElement.classList.add('js');
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body>
        {/* Decorative layers: animated glow orbs + grid, cursor glow, scroll progress */}
        <div className="site-bg" aria-hidden="true">
          <span className="orb orb-a"></span>
          <span className="orb orb-b"></span>
          <span className="orb orb-c"></span>
          <span className="bg-grid"></span>
        </div>
        <div className="cursor-glow" aria-hidden="true"></div>
        <div className="scroll-progress" aria-hidden="true"></div>

        <SiteHeader />

        <main>{children}</main>

        <SiteFooter />

        <SiteBehaviour />
      </body>
    </html>
  )
}
