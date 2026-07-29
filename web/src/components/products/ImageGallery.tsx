"use client"

import Image from "next/image"
import { useState } from "react"

interface ImageGalleryProps {
  images: string[]
  alt: string
  category?: string
}

// Emoji fallback basado en categoría
function getCategoryEmoji(category?: string): string {
  if (!category) return '🥐'
  const categoryMap: Record<string, string> = {
    pan: '🥖',
    panes: '🥖',
    pasteles: '🎂',
    pastel: '🎂',
    galletas: '🍪',
    galleta: '🍪',
    dulces: '🍬',
    dulce: '🍬',
    bebidas: '☕',
    bebida: '☕',
    postres: '🍰',
    postre: '🍰',
  }
  return categoryMap[category.toLowerCase()] || '🥐'
}

export function ImageGallery({ images, alt, category }: ImageGalleryProps) {
  // Filtrar URLs vacías y usar imágenes válidas
  const validImages = images?.filter(img => img && img.length > 0) || []
  const hasImages = validImages.length > 0
  
  const [current, setCurrent] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set([...prev, index]))
  }

  const renderFallback = () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <span className="text-8xl">{getCategoryEmoji(category)}</span>
    </div>
  )

  // Si no hay imágenes válidas, mostrar fallback
  if (!hasImages) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
        {renderFallback()}
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card">
        {imageErrors.has(current) ? (
          renderFallback()
        ) : (
          <Image 
            src={validImages[current]} 
            alt={alt} 
            fill 
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            onError={() => handleImageError(current)}
          />
        )}
      </div>
      {validImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {validImages.map((src, idx) => (
            <button
              key={idx}
              className={`relative aspect-square overflow-hidden rounded-md border ${idx === current ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              {imageErrors.has(idx) ? (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-xl">{getCategoryEmoji(category)}</span>
                </div>
              ) : (
                <Image 
                  src={src} 
                  alt={`${alt} miniatura ${idx + 1}`} 
                  fill 
                  className="object-cover"
                  onError={() => handleImageError(idx)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
