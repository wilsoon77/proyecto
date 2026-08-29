"use client"

import Image from "next/image"
import { useState } from "react"
import { Cake, Cookie, Coffee, Sparkles, Wheat } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  alt: string
  category?: string
}

function CategoryMark({ category, className }: { category?: string; className?: string }) {
  const value = category?.toLowerCase() || ""
  if (value.includes("pan")) return <Wheat className={className} aria-hidden="true" />
  if (value.includes("pastel") || value.includes("postre")) return <Cake className={className} aria-hidden="true" />
  if (value.includes("galleta") || value.includes("dulce")) return <Cookie className={className} aria-hidden="true" />
  if (value.includes("bebida") || value.includes("cafe") || value.includes("café")) return <Coffee className={className} aria-hidden="true" />
  return <Sparkles className={className} aria-hidden="true" />
}

export function ImageGallery({ images, alt, category }: ImageGalleryProps) {
  const validImages = images?.filter(Boolean) || []
  const [current, setCurrent] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const renderFallback = () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.75),transparent_52%),hsl(var(--secondary))] text-primary">
      <CategoryMark category={category} className="h-12 w-12 stroke-[1.4]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/45">Imagen no disponible</span>
    </div>
  )

  if (!validImages.length) {
    return <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/70">{renderFallback()}</div>
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/70">
        {imageErrors.has(current) ? renderFallback() : (
          <Image
            src={validImages[current]}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover"
            priority={current === 0}
            onError={() => setImageErrors((previous) => new Set(previous).add(current))}
          />
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {validImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Ver imagen ${index + 1}`}
              className={`public-focus relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-opacity ${current === index ? "border-primary opacity-100" : "border-border opacity-55 hover:opacity-100"}`}
            >
              {imageErrors.has(index) ? (
                <span className="flex h-full w-full items-center justify-center bg-secondary text-primary"><CategoryMark category={category} className="h-5 w-5" /></span>
              ) : (
                <Image src={image} alt={`${alt}, imagen ${index + 1}`} fill sizes="64px" className="object-cover" onError={() => setImageErrors((previous) => new Set(previous).add(index))} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
