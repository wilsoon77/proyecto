"use client"

import { notFound, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { CategoryBadge } from "@/components/products/CategoryBadge"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { ImageGallery } from "@/components/products/ImageGallery"
import { RelatedProducts } from "@/components/products/RelatedProducts"
import { useToast } from "@/context/ToastContext"
import { useRouter } from "next/navigation"
import { productsService } from "@/lib/api"
import { apiProductToProduct } from "@/lib/api/transformers"
import type { Product } from "@/types"

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addItem } = useCart()
  const { show } = useToast()
  const [qty, setQty] = useState<number>(1)
  const router = useRouter()

  // Cargar producto desde la API
  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const apiProduct = await productsService.getBySlug(slug)
        const transformedProduct = apiProductToProduct(apiProduct)
        setProduct(transformedProduct)

        // Cargar productos relacionados de la misma categoría
        const response = await productsService.list({ 
          category: apiProduct.categorySlug || apiProduct.category,
          pageSize: 5 
        })
        const related = response.data
          .filter(p => p.slug !== slug)
          .slice(0, 4)
          .map(apiProductToProduct)
        setRelatedProducts(related)
      } catch (err) {
        console.error('Error cargando producto:', err)
        setError('Producto no encontrado')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  // Estado de carga
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
          <div className="space-y-4">
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  // Producto no encontrado
  if (error || !product) {
    return notFound()
  }

  const finalPrice = product.discount && product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price

  const canAdd = product.isAvailable && qty > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-gray-600">
        <Link href={ROUTES.products} className="hover:text-primary">← Volver a productos</Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Imagen principal */}
        <div className="rounded-lg border bg-white p-4">
          <ImageGallery 
            images={product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : [])} 
            alt={product.name}
            category={product.category}
          />
        </div>

        {/* Detalles */}
        <div>
          <div className="mb-3">
            <CategoryBadge category={product.category} />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
          
          {product.isNew && (
            <span className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Nuevo
            </span>
          )}

          {product.description && (
            <p className="mb-6 text-gray-700">{product.description}</p>
          )}

          {/* Precios */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(finalPrice)}</span>
            {product.discount && product.discount > 0 && (
              <>
                <span className="text-gray-400 line-through">{formatPrice(product.price)}</span>
                <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-medium text-red-700">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>

          {/* Disponibilidad */}
          <div className="mb-4">
            {product.isAvailable ? (
              <span className="text-sm text-green-600">✓ Disponible</span>
            ) : (
              <span className="text-sm text-red-600">✗ No disponible</span>
            )}
            {product.stock > 0 && (
              <span className="ml-2 text-sm text-gray-500">({product.stock} en stock)</span>
            )}
          </div>

          {/* Selector de cantidad */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <button
                className="px-3 py-2 text-lg hover:bg-gray-100"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                aria-label="Disminuir"
              >
                −
              </button>
              <div className="w-12 text-center">{qty}</div>
              <button
                className="px-3 py-2 text-lg hover:bg-gray-100"
                onClick={() => setQty(q => q + 1)}
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
              size="lg" 
              disabled={!canAdd} 
              onClick={() => { 
                addItem(product, qty)
                show(`Agregado: ${product.name} × ${qty}`, { variant: 'success' })
              }}
            >
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
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} currentId={product.id} category={product.category} />
      )}
    </div>
  )
}
