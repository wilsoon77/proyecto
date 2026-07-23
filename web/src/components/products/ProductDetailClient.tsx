'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/products/CategoryBadge'
import { ImageGallery } from '@/components/products/ImageGallery'
import { RelatedProducts } from '@/components/products/RelatedProducts'
import { useCart } from '@/context/CartContext'
import { ROUTES } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductDetailClientProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const hasStock = product.stock > 0
  const canAdd = product.isAvailable && hasStock && qty > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-gray-600">
        <Link href={ROUTES.products} className="hover:text-primary">← Volver a productos</Link>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <ImageGallery images={product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : [])} alt={product.name} category={product.category} />
        </div>
        <div>
          <div className="mb-3"><CategoryBadge category={product.category} /></div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
          {product.isNew && <span className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Nuevo</span>}
          {product.description && <p className="mb-6 text-gray-700">{product.description}</p>}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {product.comboQuantity && product.comboPrice ? <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">¡Lleva {product.comboQuantity} por Q{Number(product.comboPrice).toFixed(2)}!</span> : null}
          </div>
          <div className="mb-4">
            {!hasStock ? <span className="text-sm font-semibold text-red-600">✕ Agotado</span> : product.isAvailable ? <span className="text-sm text-green-600">✓ Disponible</span> : <span className="text-sm text-red-600">✕ No disponible</span>}
            {hasStock && <span className="ml-2 text-sm text-gray-500">({product.stock} en stock)</span>}
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <button className="px-3 py-2 text-lg hover:bg-gray-100 disabled:opacity-50" onClick={() => setQty((value) => Math.max(1, value - 1))} disabled={!canAdd} aria-label="Disminuir">−</button>
              <div className="w-12 text-center">{hasStock ? qty : 0}</div>
              <button className="px-3 py-2 text-lg hover:bg-gray-100 disabled:opacity-50" onClick={() => setQty((value) => Math.min(value + 1, product.stock))} disabled={!canAdd || qty >= product.stock} aria-label="Aumentar">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" disabled={!canAdd} onClick={() => addItem(product, qty)}>Agregar al carrito</Button>
            <Button size="lg" variant="outline" disabled={!canAdd} onClick={() => { addItem(product, qty); router.push(ROUTES.checkout) }}>Comprar ahora</Button>
          </div>
        </div>
      </div>
      {relatedProducts.length > 0 && <RelatedProducts products={relatedProducts} currentId={product.id} category={product.category} />}
    </div>
  )
}
