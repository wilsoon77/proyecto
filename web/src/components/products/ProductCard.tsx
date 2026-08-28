"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Cake, Cookie, Coffee, ShoppingCart, Sparkles, Wheat } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/types"
import { defaultSalePresentation, maxPresentationQuantity, presentationUnitPrice } from "@/lib/presentation-quantities"

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

function CategoryMark({ category, className }: { category?: string; className?: string }) {
  const value = category?.toLowerCase() || ""
  if (value.includes("pan")) return <Wheat className={className} aria-hidden="true" />
  if (value.includes("pastel") || value.includes("postre")) return <Cake className={className} aria-hidden="true" />
  if (value.includes("galleta") || value.includes("dulce")) return <Cookie className={className} aria-hidden="true" />
  if (value.includes("bebida") || value.includes("cafe") || value.includes("café")) return <Coffee className={className} aria-hidden="true" />
  return <Sparkles className={className} aria-hidden="true" />
}

function categoryLabel(category: string) {
  return category.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const defaultPresentation = defaultSalePresentation(product)
  const displayPrice = presentationUnitPrice(product, defaultPresentation)
  const presentationStock = defaultPresentation ? maxPresentationQuantity(product, defaultPresentation) : product.stock
  const isOutOfStock = product.stock === 0 || presentationStock === 0 || !product.isAvailable
  const isLowStock = !isOutOfStock && presentationStock <= 5

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-[#E8DCCB] bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-[#D97706]/50 hover:shadow-[0_20px_40px_-20px_rgba(43,23,15,0.22)]">
      <Link href={`/productos/${product.slug}`} className="public-focus block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F5ECE1]">
          {product.imageUrl && !imageError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top_right,#FDE68A,transparent_60%),#F5ECE1] text-[#A25514]">
              <CategoryMark category={product.category} className="h-9 w-9 stroke-[1.5]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C522B]">Pan artesanal</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
          <span className="truncate text-[#8C522B]">{categoryLabel(product.category)}</span>
          {product.isNew && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[#9E4D1A]">Nuevo</span>
          )}
        </div>

        <Link href={`/productos/${product.slug}`} className="public-focus mt-2 block">
          <h2 className="line-clamp-2 min-h-[2.65rem] font-display text-lg leading-tight tracking-[-0.025em] text-[#24140D] transition-colors group-hover:text-[#D97706] sm:text-xl">{product.name}</h2>
        </Link>

        {product.description && <p className="mt-2 hidden line-clamp-2 text-xs leading-relaxed text-[#6E5545] sm:block">{product.description}</p>}

        <div className="mt-auto border-t border-[#EFE5D8] pt-3.5 sm:mt-5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C522B]">Desde</p>
              <p className="mt-0.5 truncate text-base font-bold text-[#24140D] sm:text-lg">{formatPrice(displayPrice)}</p>
              {isLowStock && <p className="mt-1 text-[10px] font-semibold text-[#D97706]">Quedan {presentationStock}</p>}
              {isOutOfStock && <p className="mt-1 text-[10px] font-semibold text-destructive">Agotado por ahora</p>}
            </div>

            {onAddToCart && (
              <button
                type="button"
                onClick={() => onAddToCart(product.id)}
                disabled={isOutOfStock}
                aria-label={isOutOfStock ? `${product.name}, agotado` : `Agregar ${product.name} al carrito`}
                className="public-focus touch-tactile inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-[0_6px_16px_-4px_rgba(217,119,6,0.5)] transition-all hover:bg-primary/90 hover:shadow-[0_8px_20px_-4px_rgba(217,119,6,0.65)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none sm:px-4"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
