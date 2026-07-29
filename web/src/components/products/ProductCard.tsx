"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

function getCategoryEmoji(category: string): string {
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
  }
  return categoryMap[category?.toLowerCase()] || '🥐'
}

export function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5
  const [imageError, setImageError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)

  const hasValidImage = product.imageUrl && !imageError

  const handleAddToCart = () => {
    setCartAnimating(true)
    onAddToCart?.(product.id)
    setTimeout(() => setCartAnimating(false), 400)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsFavorite(!isFavorite)
    onToggleFavorite?.(product.id)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={`/productos/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {hasValidImage ? (
            <Image
              src={product.imageUrl!}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-2 bg-bakery-gradient">
              <span className="text-6xl transition-transform duration-300 group-hover:scale-110">{getCategoryEmoji(product.category)}</span>
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && (
              <Badge className="bg-success text-white shadow-sm">Nuevo</Badge>
            )}
            {product.comboQuantity && product.comboPrice ? (
              <Badge className="bg-primary text-primary-foreground shadow-sm">
                {product.comboQuantity}x Q{Number(product.comboPrice).toFixed(2)}
              </Badge>
            ) : null}
            {isOutOfStock && (
              <Badge variant="destructive" className="shadow-sm">Agotado</Badge>
            )}
            {isLowStock && (
              <Badge className="bg-warning text-white shadow-sm">
                ¡Últimas {product.stock}!
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-card group-hover:translate-y-0 group-hover:opacity-100 sm:translate-y-2 sm:opacity-0"
            aria-label="Agregar a favoritos"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorite
                  ? 'fill-destructive text-destructive'
                  : 'text-muted-foreground hover:text-destructive'
              }`}
            />
          </button>

          {/* Low stock progress bar */}
          {isLowStock && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div
                className="h-full bg-warning transition-all duration-500"
                style={{ width: `${(product.stock / 5) * 100}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/productos/${product.slug}`}>
          <h3 className="mb-1 font-display text-base font-semibold text-card-foreground line-clamp-1 transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 transition-colors ${
                    i < Math.floor(product.rating!)
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.comboQuantity && product.comboPrice ? (
            <span className="text-xs text-primary/70 font-medium">
              {product.comboQuantity}x Q{Number(product.comboPrice).toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full transition-all ${cartAnimating ? 'animate-cart-bounce' : ''}`}
          size="sm"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Agotado' : 'Agregar'}
        </Button>
      </div>
    </div>
  )
}
