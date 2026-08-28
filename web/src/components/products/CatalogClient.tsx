'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useSystemConfig } from '@/context/SystemConfigContext'
import { productsService } from '@/lib/api'
import { apiProductToProduct } from '@/lib/api/transformers'
import type { ApiCategory, PaginatedResponse, ProductFilters } from '@/lib/api/types'
import type { Product } from '@/types'
import { defaultSalePresentation } from '@/lib/presentation-quantities'

interface CatalogClientProps {
  initialCatalog: PaginatedResponse<import('@/lib/api/types').ApiProduct>
  categories: ApiCategory[]
  filters: ProductFilters
}

function catalogUrl(filters: ProductFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('q', filters.search)
  if (filters.category) params.set('cat', filters.category)
  if (filters.min !== undefined) params.set('min', String(filters.min))
  if (filters.max !== undefined) params.set('max', String(filters.max))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.branch) params.set('branch', filters.branch)
  const query = params.toString()
  return query ? `/productos?${query}` : '/productos'
}

export function CatalogClient({ initialCatalog, categories, filters }: CatalogClientProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { show } = useToast()
  const { canPurchase, isCatalogOnly, isLoading: isConfigLoading } = useSystemConfig()
  const [products, setProducts] = useState<Product[]>(() => initialCatalog.data.map(apiProductToProduct))
  const [currentPage, setCurrentPage] = useState(initialCatalog.meta.page)
  const [totalPages, setTotalPages] = useState(initialCatalog.meta.pageCount)
  const [totalProducts, setTotalProducts] = useState(initialCatalog.meta.total)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProducts(initialCatalog.data.map(apiProductToProduct))
      setCurrentPage(initialCatalog.meta.page)
      setTotalPages(initialCatalog.meta.pageCount)
      setTotalProducts(initialCatalog.meta.total)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialCatalog])

  const handleAddToCart = (productId: number) => {
    if (!canPurchase) return
    const product = products.find((item) => item.id === productId)
    if (product) addItem(product, 1, defaultSalePresentation(product))
  }

  const changeCategory = (category?: string) => {
    router.push(catalogUrl({ ...filters, category, page: 1 }))
  }

  const loadMore = async () => {
    if (isLoadingMore || currentPage >= totalPages) return

    setIsLoadingMore(true)
    try {
      const response = await productsService.list({ ...filters, page: currentPage + 1, pageSize: filters.pageSize ?? 12 })
      setProducts((current) => [...current, ...response.data.map(apiProductToProduct)])
      setCurrentPage(response.meta.page)
      setTotalPages(response.meta.pageCount)
      setTotalProducts(response.meta.total)
    } catch (error) {
      console.error('Error cargando más productos:', error)
      show('No fue posible cargar más productos. Intenta nuevamente.', { variant: 'error' })
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <div className="public-container py-8 sm:py-12">
      <header className="grid gap-5 border-b border-[#E8DCCB] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            Catálogo Svetlana
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#24140D] sm:text-5xl">Elige algo recién horneado.</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6E5545] sm:text-base">Explora pan, repostería y bebidas tradicionales. Todo se prepara para que lo recojas recién horneado en tu sucursal favorita.</p>
        </div>
        <p className="text-sm font-semibold text-[#8C522B] lg:pb-1">{totalProducts} {totalProducts === 1 ? 'producto disponible' : 'productos disponibles'}</p>
      </header>

      {!isConfigLoading && isCatalogOnly && (
        <div role="status" className="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
          Catálogo informativo: puedes consultar productos y precios, pero las compras están deshabilitadas temporalmente.
        </div>
      )}

      <div className="mt-8 flex items-center gap-2.5">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
        <p className="text-sm font-bold text-[#24140D]">Filtrar el catálogo</p>
      </div>

      <form action="/productos" method="get" className="mt-4 grid gap-3.5 rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.6fr_0.65fr_0.65fr_1fr_auto] lg:items-end lg:p-6">
        {filters.branch && <input type="hidden" name="branch" value={filters.branch} />}
        {filters.category && <input type="hidden" name="cat" value={filters.category} />}

        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="catalog-search" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Buscar</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C522B]" aria-hidden="true" />
            <input id="catalog-search" name="q" defaultValue={filters.search ?? ''} placeholder="Pan francés, conchas..." className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white pl-10 pr-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/60 shadow-xs" />
          </div>
        </div>

        <div>
          <label htmlFor="catalog-min" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Precio mínimo</label>
          <input id="catalog-min" name="min" defaultValue={filters.min ?? ''} placeholder="Q 0" type="number" min="0" step="0.01" className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/60 shadow-xs" />
        </div>

        <div>
          <label htmlFor="catalog-max" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Precio máximo</label>
          <input id="catalog-max" name="max" defaultValue={filters.max ?? ''} placeholder="Q 100" type="number" min="0" step="0.01" className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/60 shadow-xs" />
        </div>

        <div>
          <label htmlFor="catalog-sort" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Ordenar</label>
          <select id="catalog-sort" name="sort" defaultValue={filters.sort ?? ''} className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] shadow-xs">
            <option value="">Relevancia</option>
            <option value="precio-asc">Precio menor</option>
            <option value="precio-desc">Precio mayor</option>
            <option value="nuevo">Novedades</option>
          </select>
        </div>

        <Button type="submit" className="h-12 rounded-2xl px-6 font-bold shadow-[0_4px_12px_-2px_rgba(217,119,6,0.4)] lg:min-w-[118px]">Aplicar</Button>
      </form>

      <nav aria-label="Categorías de productos" className="mt-6 -mx-4 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-2">
          <button type="button" onClick={() => changeCategory()} className={`public-focus rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${!filters.category ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-[#DFCFC0] bg-white text-[#6E5545] hover:border-primary hover:text-primary'}`}>Todos</button>
          {categories.map((category) => {
            const active = filters.category === category.slug
            return <button key={category.id} type="button" onClick={() => changeCategory(category.slug)} className={`public-focus rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-[#DFCFC0] bg-white text-[#6E5545] hover:border-primary hover:text-primary'}`}>{category.name}</button>
          })}
        </div>
      </nav>

      <div className="mt-8">
        <ProductGrid products={products} onAddToCart={canPurchase ? handleAddToCart : undefined} />
      </div>

      {products.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-7">
          <p className="text-sm text-muted-foreground">Mostrando {products.length} de {totalProducts}</p>
          {currentPage < totalPages && (
            <Button variant="outline" size="lg" onClick={loadMore} disabled={isLoadingMore} className="h-12 rounded-full border-border px-6">
              {isLoadingMore ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando...</> : 'Cargar más productos'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
