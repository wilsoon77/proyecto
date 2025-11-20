"use client"

import Image from "next/image"
import { useState } from "react"

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const safeImages = images && images.length > 0 ? images : [
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%23111827' font-family='sans-serif'%3EImagen%3C/text%3E%3C/svg%3E"
  ]
  const [current, setCurrent] = useState(0)

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
        <Image src={safeImages[current]} alt={alt} fill className="object-cover" />
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {safeImages.map((src, idx) => (
            <button
              key={idx}
              className={`relative aspect-square overflow-hidden rounded-md border ${idx === current ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <Image src={src} alt={`${alt} miniatura ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
