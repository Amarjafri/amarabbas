import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter_Tight, JetBrains_Mono } from 'next/font/google'

import './globals.css'
import SiteBehaviour from '@/components/SiteBehaviour'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { setting } from '@/lib/data'

// Same three faces as the Laravel build (Fraunces · Inter Tight · JetBrains
// Mono), self-hosted by next/font instead of fetched from Google at runtime.
// globals.css maps --font-display/-body/-mono onto these variables.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#12161a' },
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
  ],
}

/**
 * Applies the stored theme before first paint so there is no flash — the same
 * inline script the Blade layout carried in its <head>.
 */
const themeScript = `(function () {
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
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
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
        <SiteHeader />

        <main>{children}</main>

        <SiteFooter />

        <SiteBehaviour />
      </body>
    </html>
  )
}
