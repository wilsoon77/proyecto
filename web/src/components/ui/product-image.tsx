"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

interface ProductImageProps {
  src?: string | null
  alt: string
  category?: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
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

/**
 * Componente de imagen para productos con manejo automático de errores
 * y fallback visual cuando la imagen no está disponible.
 */
export function ProductImage({ 
  src, 
  alt, 
  category,
  width, 
  height, 
  fill = false, 
  className = "",
  sizes,
  priority = false
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Si no hay src o hubo error, mostrar fallback
  if (!src || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-4xl">{getCategoryEmoji(category)}</span>
      </div>
    )
  }

  return (
    <div className={`relative ${fill ? '' : ''}`} style={!fill ? { width, height } : undefined}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes || (fill ? "(max-width: 768px) 50vw, 25vw" : `${width}px`)}
        priority={priority}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={!fill ? { width: 'auto', height: 'auto' } : undefined}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}

/**
 * Versión minimalista para thumbnails en tablas
 */
export function ProductThumbnail({
  src,
  alt,
  category,
  size = 56
}: {
  src?: string | null
  alt: string
  category?: string
  size?: number
}) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ width: size, height: size }}
      >
        <span className="text-2xl">{getCategoryEmoji(category)}</span>
      </div>
    )
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
