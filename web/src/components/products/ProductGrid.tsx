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
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-cream p-12">
        <div className="mb-4 text-6xl">🥖</div>
        <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
          No hay productos disponibles
        </h3>
        <p className="text-muted-foreground">
          Intenta cambiar los filtros o vuelve más tarde
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
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
