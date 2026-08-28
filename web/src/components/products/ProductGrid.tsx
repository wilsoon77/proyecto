import { Product } from "@/types"
import { ProductCard } from "./ProductCard"
import { SearchX } from "lucide-react"

interface ProductGridProps {
  products: Product[]
  onAddToCart?: (productId: number) => void
  onToggleFavorite?: (productId: number) => void
}

export function ProductGrid({ products, onAddToCart, onToggleFavorite }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="surface-panel flex min-h-[330px] flex-col items-center justify-center p-8 text-center sm:p-12">
        <SearchX className="h-8 w-8 text-primary" aria-hidden="true" />
        <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">No encontramos ese producto</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Prueba con otra categoría o cambia los filtros para ver más opciones.</p>
      </div>
    )
  }

  return (
    <div className="stagger-children grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
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
