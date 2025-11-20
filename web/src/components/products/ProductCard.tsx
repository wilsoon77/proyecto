"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

export function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Product Image */}
  <Link href={`/productos/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              {product.category === 'pan' && '🥖'}
              {product.category === 'pasteles' && '🎂'}
              {product.category === 'galletas' && '🍪'}
              {product.category === 'dulces' && '🍞'}
              {!['pan', 'pasteles', 'galletas', 'dulces'].includes(product.category) && '🥐'}
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className="bg-green-500 text-white">Nuevo</Badge>
            )}
            {product.discount && product.discount > 0 && (
              <Badge className="bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )}
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
          {product.discount && product.discount > 0 ? (
            <>
              <span className="text-lg font-bold text-primary">
                {formatPrice(product.price * (1 - product.discount / 100))}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          )}
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
