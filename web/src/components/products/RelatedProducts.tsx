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
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Productos Relacionados</h2>
      <ProductGrid products={related} />
    </section>
  )
}
