"use client"

import { useState } from "react"
import Image from "next/image"
import { Wheat, Cake, Cookie, Coffee, Sparkles } from "lucide-react"

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

function getCategoryIcon(category?: string) {
  if (!category) return Wheat
  const cat = category.toLowerCase()
  if (cat.includes('pan')) return Wheat
  if (cat.includes('pastel') || cat.includes('postre')) return Cake
  if (cat.includes('galleta') || cat.includes('dulce')) return Cookie
  if (cat.includes('bebida') || cat.includes('caf')) return Coffee
  return Sparkles
}

/**
 * Componente de imagen para productos con manejo automático de errores
 * y fallback visual usando iconos SVG limpios.
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
  const CategoryIcon = getCategoryIcon(category)

  if (!src || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/40 text-primary ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <CategoryIcon className="h-8 w-8 stroke-[1.7]" />
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
  const CategoryIcon = getCategoryIcon(category)

  if (!src || hasError) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/40 text-primary rounded-xl"
        style={{ width: size, height: size }}
      >
        <CategoryIcon className="h-5 w-5 stroke-[1.7]" />
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ width: size, height: size }}>
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
