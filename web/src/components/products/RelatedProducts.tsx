import type { Product } from "@/types"
import { ProductGrid } from "./ProductGrid"

interface RelatedProductsProps {
  products: Product[]
  currentId: number
  category: string
}

export function RelatedProducts({ products, currentId, category }: RelatedProductsProps) {
  const related = products.filter(p => p.category === category && p.id !== currentId).slice(0, 4)
  if (related.length === 0) return null

  return (
    <section>
      <p className="section-kicker">También puede gustarte</p>
      <h2 className="mb-6 mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-foreground">Más para compartir</h2>
      <ProductGrid products={related} />
    </section>
  )
}
