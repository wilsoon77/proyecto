'use client'

import { useMemo, useState } from 'react'
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
import { defaultSalePresentation, maxPresentationQuantity, presentationUnitPrice, salePresentations } from '@/lib/presentation-quantities'

interface ProductDetailClientProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const presentations = useMemo(() => salePresentations(product), [product])
  const [selectedPresentationId, setSelectedPresentationId] = useState<number | undefined>(() => defaultSalePresentation(product)?.id)
  const selectedPresentation = presentations.find((presentation) => presentation.id === selectedPresentationId) ?? presentations[0]
  const maxQty = maxPresentationQuantity(product, selectedPresentation)
  const hasStock = product.stock > 0 && maxQty > 0
  const canAdd = product.isAvailable && hasStock && qty > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href={ROUTES.products} className="hover:text-primary transition-colors">← Volver a productos</Link>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <ImageGallery images={product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : [])} alt={product.name} category={product.category} />
        </div>
        <div className="flex flex-col justify-center">
          <div className="mb-3"><CategoryBadge category={product.category} /></div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{product.name}</h1>
          {product.isNew && <span className="mb-4 inline-block rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">Nuevo</span>}
          {product.description && <p className="mb-6 text-muted-foreground">{product.description}</p>}
          {presentations.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-foreground">¿Cómo lo deseas?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {presentations.map((presentation) => (
                  <button
                    key={presentation.id}
                    type="button"
                    onClick={() => { setSelectedPresentationId(presentation.id); setQty(1) }}
                    className={`rounded-lg border p-3 text-left transition-colors ${selectedPresentation?.id === presentation.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <span className="block font-medium">{presentation.name}</span>
                    <span className="text-sm text-primary">{formatPrice(presentation.price ?? product.price)}</span>
                    <span className="block text-xs text-muted-foreground">{presentation.unitsInStock} {product.stockUnitLabel ?? 'piezas'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(presentationUnitPrice(product, selectedPresentation))}</span>
            {presentations.length === 0 && product.comboQuantity && product.comboPrice ? <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">¡Lleva {product.comboQuantity} por Q{Number(product.comboPrice).toFixed(2)}!</span> : null}
          </div>
          <div className="mb-4">
            {!hasStock ? <span className="text-sm font-semibold text-destructive">✕ Agotado</span> : product.isAvailable ? <span className="text-sm text-success">✓ Disponible</span> : <span className="text-sm text-destructive">✕ No disponible</span>}
            {hasStock && <span className="ml-2 text-sm text-muted-foreground">({maxQty} disponibles)</span>}
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border bg-card">
              <button className="px-4 py-2 text-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors rounded-l-lg" onClick={() => setQty((value) => Math.max(1, value - 1))} disabled={!canAdd} aria-label="Disminuir">−</button>
              <div className="w-12 text-center font-medium">{hasStock ? qty : 0}</div>
              <button className="px-4 py-2 text-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors rounded-r-lg" onClick={() => setQty((value) => Math.min(value + 1, maxQty))} disabled={!canAdd || qty >= maxQty} aria-label="Aumentar">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" disabled={!canAdd} onClick={() => addItem(product, qty, selectedPresentation)} className="shadow-warm">Agregar al carrito</Button>
            <Button size="lg" variant="outline" disabled={!canAdd} onClick={() => { addItem(product, qty, selectedPresentation); router.push(ROUTES.checkout) }}>Comprar ahora</Button>
          </div>
        </div>
      </div>
      {relatedProducts.length > 0 && <RelatedProducts products={relatedProducts} currentId={product.id} category={product.category} />}
    </div>
  )
}
