import { Product } from "@/types"
import { ProductCard } from "./ProductCard"

interface ProductGridProps {
  products: Product[]
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

export function ProductGrid({ products, onAddToCart, onToggleFavorite }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
        <div className="text-6xl mb-4">🥖</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          No hay productos disponibles
        </h3>
        <p className="text-gray-600">
          Intenta cambiar los filtros o vuelve más tarde
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
