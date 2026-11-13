'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingCart, XCircle } from 'lucide-react'
import { CategoryBadge } from '@/components/products/CategoryBadge'
import { ImageGallery } from '@/components/products/ImageGallery'
import { RelatedProducts } from '@/components/products/RelatedProducts'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { useSystemConfig } from '@/context/SystemConfigContext'
import { useSelectedBranch } from '@/hooks/use-branches'
import { productsService } from '@/lib/api'
import { apiProductToProduct } from '@/lib/api/transformers'
import { ROUTES } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { defaultSalePresentation, maxPresentationQuantity, presentationUnitPrice, salePresentations } from '@/lib/presentation-quantities'
import type { Product } from '@/types'

interface ProductDetailClientProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart()
  const { canPurchase, isCatalogOnly, isLoading: isConfigLoading } = useSystemConfig()
  const { selectedBranch, selectedBranchSlug } = useSelectedBranch()
  const router = useRouter()
  const [activeProduct, setActiveProduct] = useState<Product>(product)
  const [activeRelated, setActiveRelated] = useState<Product[]>(relatedProducts)
  const [qty, setQty] = useState(1)
  const presentations = useMemo(() => salePresentations(activeProduct), [activeProduct])
  const [selectedPresentationId, setSelectedPresentationId] = useState<number | undefined>(() => defaultSalePresentation(product)?.id)
  const selectedPresentation = presentations.find((presentation) => presentation.id === selectedPresentationId) ?? presentations[0]
  const maxQty = maxPresentationQuantity(activeProduct, selectedPresentation)
  const hasStock = activeProduct.stock > 0 && maxQty > 0
  const canAdd = canPurchase && activeProduct.isAvailable && hasStock && qty > 0

  useEffect(() => {
    setActiveProduct(product)
    setActiveRelated(relatedProducts)
    setSelectedPresentationId(defaultSalePresentation(product)?.id)
    setQty(1)
  }, [product, relatedProducts])

  useEffect(() => {
    if (!selectedBranchSlug) return

    let cancelled = false
    const syncBranchProduct = async () => {
      try {
        const [branchProduct, branchRelated] = await Promise.all([
          productsService.getBySlug(product.slug, selectedBranchSlug),
          productsService.list({
            category: product.category,
            branch: selectedBranchSlug,
            page: 1,
            pageSize: 5,
          }),
        ])
        if (cancelled) return

        const mappedProduct = apiProductToProduct(branchProduct)
        setActiveProduct(mappedProduct)
        setActiveRelated(
          branchRelated.data
            .map(apiProductToProduct)
            .filter((item) => item.slug !== mappedProduct.slug)
            .slice(0, 4),
        )
      } catch (error) {
        console.error('Error cargando disponibilidad por sucursal:', error)
      }
    }

    syncBranchProduct()
    return () => {
      cancelled = true
    }
  }, [product.slug, product.category, selectedBranchSlug])

  useEffect(() => {
    setQty((prev) => Math.max(1, Math.min(prev, Math.max(1, maxQty))))
  }, [maxQty])

  const addToCart = () => {
    if (canPurchase) addItem(activeProduct, qty, selectedPresentation)
  }

  return (
    <div className="public-container py-8 sm:py-12">
      <Link href={ROUTES.products} className="public-focus inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al catálogo
      </Link>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 lg:sticky lg:top-24">
          <ImageGallery images={activeProduct.images?.length ? activeProduct.images : activeProduct.imageUrl ? [activeProduct.imageUrl] : []} alt={activeProduct.name} category={activeProduct.category} />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={activeProduct.category} />
            {activeProduct.isNew && <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Nuevo</span>}
          </div>

          <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl">{activeProduct.name}</h1>
          {activeProduct.description && <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">{activeProduct.description}</p>}

          <div className="mt-7 flex flex-wrap items-end gap-3 border-y border-border py-5">
            <span className="font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">{formatPrice(presentationUnitPrice(activeProduct, selectedPresentation))}</span>
            {activeProduct.comboQuantity && activeProduct.comboPrice && presentations.length === 0 && <span className="pb-1 text-sm font-semibold text-primary">{activeProduct.comboQuantity} por Q{Number(activeProduct.comboPrice).toFixed(2)}</span>}
          </div>

          {presentations.length > 0 && (
            <div className="mt-7">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-bold text-foreground">Elige una presentación</h2>
                <span className="text-xs text-muted-foreground">Cambia el precio y la cantidad</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {presentations.map((presentation) => {
                  const selected = selectedPresentation?.id === presentation.id
                  const presentationAvailable = maxPresentationQuantity(activeProduct, presentation)
                  return (
                    <button key={presentation.id} type="button" onClick={() => { setSelectedPresentationId(presentation.id); setQty(1) }} className={`public-focus rounded-xl border p-4 text-left transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/45'}`}>
                      <span className="block text-sm font-bold text-foreground">{presentation.name}</span>
                      <span className="mt-1 block text-base font-bold text-primary">{formatPrice(presentation.price ?? activeProduct.price)}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{presentation.unitsInStock} {activeProduct.stockUnitLabel ?? 'unidades'} · {presentationAvailable} disp.</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center gap-2 text-sm font-semibold">
            {!hasStock ? (
              <>
                <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                <span className="text-destructive">Agotado en {selectedBranch?.name || 'esta sucursal'}</span>
              </>
            ) : activeProduct.isAvailable ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-foreground">
                  Disponible en {selectedBranch?.name || 'esta sucursal'} ({maxQty} {maxQty === 1 ? 'disponible' : 'disponibles'})
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                <span className="text-destructive">No disponible temporalmente</span>
              </>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-6">
            {isConfigLoading ? (
              <div role="status" className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Verificando disponibilidad de compra...
              </div>
            ) : isCatalogOnly ? (
              <div role="status" className="rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
                Este sitio está en modo catálogo. Puedes consultar el producto y su precio, pero las compras están deshabilitadas temporalmente.
              </div>
            ) : (
              <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Cantidad</span>
              <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} disabled={!canAdd || qty <= 1} aria-label="Disminuir cantidad" className="public-focus inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary disabled:opacity-35"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                <span className="w-10 text-center text-sm font-bold text-foreground">{hasStock ? qty : 0}</span>
                <button type="button" onClick={() => setQty((value) => Math.min(value + 1, maxQty))} disabled={!canAdd || qty >= maxQty} aria-label="Aumentar cantidad" className="public-focus inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary disabled:opacity-35"><Plus className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button size="lg" disabled={!canAdd} onClick={addToCart} className="touch-tactile h-12 rounded-full font-semibold shadow-warm"><ShoppingCart className="h-4 w-4" aria-hidden="true" />Agregar al carrito</Button>
              <Button size="lg" variant="outline" disabled={!canAdd} onClick={() => { addToCart(); router.push(ROUTES.checkout) }} className="touch-tactile h-12 rounded-full border-border font-semibold">Comprar ahora</Button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Reserva en línea. Pagas al recoger en la sucursal seleccionada.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {activeRelated.length > 0 && <div className="mt-16 border-t border-border pt-10"><RelatedProducts products={activeRelated} currentId={activeProduct.id} category={activeProduct.category} /></div>}
    </div>
  )
}
