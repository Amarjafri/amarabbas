'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

/**
 * The gallery + lightbox from projects/show.blade.php. The Blade version used
 * inline onclick handlers and a global openLightbox(); the markup and classes
 * are unchanged, only the wiring is React.
 */
export default function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }

    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [])

  if (images.length === 0) return null

  return (
    <>
      <div className="pd-gallery">
        <h2>Project Gallery</h2>
        <div className="gallery-grid">
          {images.map((img, index) => (
            <button
              type="button"
              className="gallery-item"
              onClick={() => setActive(img)}
              aria-label={`Open image ${index + 1} full size`}
              key={img}
            >
              <Image src={img} alt="" width={600} height={400} loading="lazy" />
              <span className="gallery-overlay" aria-hidden="true">
                <i className="fas fa-expand"></i>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`lightbox ${active ? 'active' : ''}`}
        id="lightbox"
        onClick={() => setActive(null)}
      >
        {/* Only rendered while open: an empty src makes the browser re-request the page. */}
        {active && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active} id="lightboxImg" alt={`${title} — gallery`} />
        )}
        <button className="lightbox-close" onClick={() => setActive(null)} type="button">
          ✕
        </button>
      </div>
    </>
  )
}
