'use client'

import { useState } from 'react'

/** The copy-link button from the blog post sidebar in blog/show.blade.php. */
export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className="share-btn"
      id="copyLinkBtn"
      onClick={() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
    >
      {copied ? '✓ Copied' : 'Copy Link'}
    </button>
  )
}
