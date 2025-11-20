"use client"

import { notFound, useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { CategoryBadge } from "@/components/products/CategoryBadge"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { MOCK_PRODUCTS } from "@/lib/mock"
import { ImageGallery } from "@/components/products/ImageGallery"
import { RelatedProducts } from "@/components/products/RelatedProducts"
import { useToast } from "@/context/ToastContext"
import { useRouter } from "next/navigation"

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  const product = useMemo(() => MOCK_PRODUCTS.find(p => p.slug === slug), [slug])

  const { addItem } = useCart()
  const { show } = useToast()
  const [qty, setQty] = useState<number>(1)
  const router = useRouter()

  if (!product) {
    return notFound()
  }

  const finalPrice = product.discount && product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price

  const canAdd = product.stock > 0 && qty > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-gray-600">
        <Link href={ROUTES.products} className="hover:text-primary">← Volver a productos</Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Imagen principal */}
        <div className="rounded-lg border bg-white p-4">
          <ImageGallery images={product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : [])} alt={product.name} />
        </div>

        {/* Detalles */}
        <div>
          <div className="mb-3">
            <CategoryBadge category={product.category} />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
          {product.rating && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-base ${i < Math.floor(product.rating!) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                ))}
              </div>
              <span>({product.reviewCount || 0} reseñas)</span>
            </div>
          )}

          {product.description && (
            <p className="mb-6 text-gray-700">{product.description}</p>
          )}

          {/* Precios */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(finalPrice)}</span>
            {product.discount && product.discount > 0 && (
              <span className="text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Selector de cantidad */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <button
                className="px-3 py-2 text-lg"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                aria-label="Disminuir"
              >
                −
              </button>
              <div className="w-12 text-center">{qty}</div>
              <button
                className="px-3 py-2 text-lg"
                onClick={() => setQty(q => q + 1)}
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" disabled={!canAdd} onClick={() => { addItem(product, qty); show(`Agregado: ${product.name} × ${qty}`) }}>
              Agregar al carrito
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={!canAdd}
              onClick={() => {
                addItem(product, qty)
                router.push(ROUTES.checkout)
              }}
            >
              Comprar ahora
            </Button>
          </div>
        </div>
      </div>

        {/* Relacionados */}
        <RelatedProducts products={MOCK_PRODUCTS} currentId={product.id} category={product.category} />
    </div>
  )
}
