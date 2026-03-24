"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Heart, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

// Emoji fallback basado en categoría
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

  const hasValidImage = product.imageUrl && !imageError

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Product Image */}
      <Link href={`/productos/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {hasValidImage ? (
            <Image
              src={product.imageUrl!}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-2 text-gray-400">
              <span className="text-6xl">{getCategoryEmoji(product.category)}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className="bg-green-500 text-white">Nuevo</Badge>
            )}
            {product.comboQuantity && product.comboPrice ? (
              <Badge className="bg-amber-500 text-white">
                {product.comboQuantity}x Q{Number(product.comboPrice).toFixed(2)}
              </Badge>
            ) : null}
            {isOutOfStock && (
              <Badge variant="destructive">Agotado</Badge>
            )}
            {isLowStock && (
              <Badge className="bg-orange-500 text-white">
                ¡Últimas {product.stock}!
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite?.(product.id)
            }}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
            aria-label="Agregar a favoritos"
          >
            <Heart className="h-4 w-4 text-gray-600 hover:fill-red-500 hover:text-red-500" />
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
  <Link href={`/productos/${product.slug}`}>
          <h3 className="mb-1 font-semibold text-gray-900 line-clamp-1 hover:text-primary">
            {product.name}
          </h3>
        </Link>
        
        {product.description && (
          <p className="mb-2 text-sm text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="mb-2 flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">
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
            <span className="text-xs text-amber-600 font-medium">
              {product.comboQuantity}x Q{Number(product.comboPrice).toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={() => onAddToCart?.(product.id)}
          disabled={isOutOfStock}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Agotado' : 'Agregar'}
        </Button>
      </div>
    </div>
  )
}
