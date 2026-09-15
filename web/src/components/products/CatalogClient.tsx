'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search, SlidersHorizontal, X, ArrowUpDown, Tag, Check } from 'lucide-react'
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

const SORT_LABELS: Record<string, string> = {
  'precio-asc': 'Menor precio',
  'precio-desc': 'Mayor precio',
  'nuevo': 'Novedades',
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

  // Estado para la búsqueda rápida en móvil y drawer
  const [mobileSearch, setMobileSearch] = useState(filters.search ?? '')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [tempMin, setTempMin] = useState(filters.min !== undefined ? String(filters.min) : '')
  const [tempMax, setTempMax] = useState(filters.max !== undefined ? String(filters.max) : '')
  const [tempSort, setTempSort] = useState(filters.sort ?? '')
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProducts(initialCatalog.data.map(apiProductToProduct))
      setCurrentPage(initialCatalog.meta.page)
      setTotalPages(initialCatalog.meta.pageCount)
      setTotalProducts(initialCatalog.meta.total)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialCatalog])

  // Sincronizar estados locales cuando cambian los filtros
  useEffect(() => {
    setMobileSearch(filters.search ?? '')
    setTempMin(filters.min !== undefined ? String(filters.min) : '')
    setTempMax(filters.max !== undefined ? String(filters.max) : '')
    setTempSort(filters.sort ?? '')
  }, [filters])

  // Bloquear scroll de fondo al abrir drawer en móvil
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFilterDrawerOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isFilterDrawerOpen])

  const handleAddToCart = (productId: number) => {
    if (!canPurchase) return
    const product = products.find((item) => item.id === productId)
    if (product) addItem(product, 1, defaultSalePresentation(product))
  }

  const changeCategory = (category?: string) => {
    router.push(catalogUrl({ ...filters, category, page: 1 }))
  }

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(catalogUrl({ ...filters, search: mobileSearch.trim() || undefined, page: 1 }))
  }

  const handleClearSearch = () => {
    setMobileSearch('')
    router.push(catalogUrl({ ...filters, search: undefined, page: 1 }))
  }

  const applyDrawerFilters = () => {
    setIsFilterDrawerOpen(false)
    const minVal = tempMin ? Number(tempMin) : undefined
    const maxVal = tempMax ? Number(tempMax) : undefined
    router.push(catalogUrl({
      ...filters,
      min: minVal,
      max: maxVal,
      sort: (tempSort as any) || undefined,
      page: 1,
    }))
  }

  const resetDrawerFilters = () => {
    setTempMin('')
    setTempMax('')
    setTempSort('')
    setIsFilterDrawerOpen(false)
    router.push(catalogUrl({
      ...filters,
      min: undefined,
      max: undefined,
      sort: undefined,
      page: 1,
    }))
  }

  const removeFilter = (key: 'search' | 'min' | 'max' | 'sort') => {
    router.push(catalogUrl({
      ...filters,
      [key]: undefined,
      page: 1,
    }))
  }

  const clearAllFilters = () => {
    setMobileSearch('')
    setTempMin('')
    setTempMax('')
    setTempSort('')
    router.push(catalogUrl({
      branch: filters.branch,
      page: 1,
    }))
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

  // Conteo de filtros activos no relacionados con categoría
  const activeAdvancedCount = (filters.min !== undefined ? 1 : 0) + (filters.max !== undefined ? 1 : 0) + (filters.sort ? 1 : 0)
  const hasActiveFilters = Boolean(filters.search || filters.category || filters.min !== undefined || filters.max !== undefined || filters.sort)

  return (
    <div className="public-container py-6 sm:py-10">
      {/* Header Compacto */}
      <header className="flex flex-col gap-2 border-b border-[#E8DCCB] pb-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-900">
            Catálogo Svetlana
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-[#24140D] sm:text-4xl">
            Elige algo recién horneado
          </h1>
          <p className="mt-1 text-xs text-[#6E5545] sm:text-sm">
            Panadería artesanal, repostería y bebidas tradicionales listas para recoger.
          </p>
        </div>
        <p className="text-xs font-semibold text-[#8C522B] shrink-0 sm:text-sm">
          {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
        </p>
      </header>

      {!isConfigLoading && isCatalogOnly && (
        <div role="status" className="mt-4 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-xs sm:text-sm font-medium text-amber-950">
          Catálogo informativo: puedes consultar productos y precios, pero las compras están deshabilitadas temporalmente.
        </div>
      )}

      {/* ─── BARRA DE BÚSQUEDA Y FILTROS COMPACTA PARA MÓVIL (< lg) ─── */}
      <div className="mt-5 block lg:hidden space-y-3">
        <div className="flex items-center gap-2">
          {/* Input de Búsqueda Rápida */}
          <form onSubmit={handleMobileSearchSubmit} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C522B]" aria-hidden="true" />
            <input
              type="text"
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder="Buscar conchas, francés..."
              className="public-focus h-11 w-full rounded-2xl border border-[#DECDBB] bg-white pl-9 pr-8 text-xs text-[#24140D] placeholder:text-[#8C522B]/60 shadow-2xs"
            />
            {mobileSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8C522B] hover:text-[#24140D]"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Botón Disparador de Filtros Móviles con Badge */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`public-focus relative inline-flex h-11 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold transition-colors shrink-0 shadow-2xs ${
              activeAdvancedCount > 0
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-[#DECDBB] bg-white text-[#6E5545] hover:border-primary hover:text-primary'
            }`}
            aria-label="Abrir filtros de precio y orden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Filtros</span>
            {activeAdvancedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-primary">
                {activeAdvancedCount}
              </span>
            )}
          </button>
        </div>

        {/* Chips de Filtros Activos en Móvil */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF0E6] px-2.5 py-1 text-[11px] font-semibold text-[#8C522B] border border-[#DECDBB]">
                "{filters.search}"
                <button type="button" onClick={() => removeFilter('search')} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.min !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF0E6] px-2.5 py-1 text-[11px] font-semibold text-[#8C522B] border border-[#DECDBB]">
                Mín: Q{filters.min}
                <button type="button" onClick={() => removeFilter('min')} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.max !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF0E6] px-2.5 py-1 text-[11px] font-semibold text-[#8C522B] border border-[#DECDBB]">
                Máx: Q{filters.max}
                <button type="button" onClick={() => removeFilter('max')} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.sort && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF0E6] px-2.5 py-1 text-[11px] font-semibold text-[#8C522B] border border-[#DECDBB]">
                {SORT_LABELS[filters.sort] || filters.sort}
                <button type="button" onClick={() => removeFilter('sort')} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-primary hover:underline px-1.5 py-1"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* ─── FORMULARIO HORIZONTAL PARA ESCRITORIO (>= lg) ─── */}
      <form
        action="/productos"
        method="get"
        className="mt-6 hidden lg:grid gap-3.5 rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-5 shadow-sm lg:grid-cols-[1.6fr_0.65fr_0.65fr_1fr_auto] lg:items-end lg:p-6"
      >
        {filters.branch && <input type="hidden" name="branch" value={filters.branch} />}
        {filters.category && <input type="hidden" name="cat" value={filters.category} />}

        <div>
          <label htmlFor="catalog-search" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C522B]" aria-hidden="true" />
            <input
              id="catalog-search"
              name="q"
              defaultValue={filters.search ?? ''}
              placeholder="Pan francés, conchas..."
              className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white pl-10 pr-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/60 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label htmlFor="catalog-min" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">
            Precio mínimo
          </label>
          <input
            id="catalog-min"
            name="min"
            defaultValue={filters.min ?? ''}
            placeholder="Q 0"
            type="number"
            min="0"
            step="0.01"
            className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/60 shadow-xs"
          />
        </div>

        <div>
          <label htmlFor="catalog-max" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">
            Precio máximo
          </label>
          <input
            id="catalog-max"
            name="max"
            defaultValue={filters.max ?? ''}
            placeholder="Q 100"
            type="number"
            min="0"
            step="0.01"
            className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/60 shadow-xs"
          />
        </div>

        <div>
          <label htmlFor="catalog-sort" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">
            Ordenar
          </label>
          <select
            id="catalog-sort"
            name="sort"
            defaultValue={filters.sort ?? ''}
            className="public-focus h-12 w-full rounded-2xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] shadow-xs"
          >
            <option value="">Relevancia</option>
            <option value="precio-asc">Precio menor</option>
            <option value="precio-desc">Precio mayor</option>
            <option value="nuevo">Novedades</option>
          </select>
        </div>

        <Button type="submit" className="h-12 rounded-2xl px-6 font-bold shadow-[0_4px_12px_-2px_rgba(217,119,6,0.4)] lg:min-w-[118px]">
          Aplicar
        </Button>
      </form>

      {/* ─── PÍLDORAS DE CATEGORÍAS (INMEDIATAS, FÁCILES DE NAVEGAR) ─── */}
      <nav aria-label="Categorías de productos" className="mt-4 -mx-4 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-2">
          <button
            type="button"
            onClick={() => changeCategory()}
            className={`public-focus rounded-full border px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              !filters.category
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-[#DFCFC0] bg-white text-[#6E5545] hover:border-primary hover:text-primary'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => {
            const active = filters.category === category.slug
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => changeCategory(category.slug)}
                className={`public-focus rounded-full border px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-[#DFCFC0] bg-white text-[#6E5545] hover:border-primary hover:text-primary'
                }`}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ─── GRILLA DE PRODUCTOS (INMEDIATAMENTE VISIBLE) ─── */}
      <div className="mt-6 sm:mt-8">
        <ProductGrid products={products} onAddToCart={canPurchase ? handleAddToCart : undefined} />
      </div>

      {/* Paginación */}
      {products.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-6">
          <p className="text-xs sm:text-sm text-muted-foreground">Mostrando {products.length} de {totalProducts}</p>
          {currentPage < totalPages && (
            <Button
              variant="outline"
              size="lg"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="h-11 sm:h-12 rounded-full border-border px-6 text-xs sm:text-sm font-bold"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando...
                </>
              ) : (
                'Cargar más productos'
              )}
            </Button>
          )}
        </div>
      )}

      {/* ─── BOTTOM SHEET / DRAWER DE FILTROS EN MÓVIL ─── */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          {/* Backdrop oscurecido */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Deslizante Inferior */}
          <div
            ref={drawerRef}
            className="relative z-10 w-full max-w-lg rounded-t-3xl border-t border-[#E8DCCB] bg-[#FAF5EE] p-5 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom duration-250"
          >
            {/* Header del Drawer */}
            <div className="flex items-center justify-between border-b border-[#DECDBB] pb-3.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#D97706]" />
                <h3 className="font-display text-base font-bold text-[#24140D]">Filtros del catálogo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="rounded-full p-1.5 text-[#8C522B] hover:bg-black/5 transition-colors"
                aria-label="Cerrar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Rango de Precios */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8C522B]">
                Rango de Precio (Q)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-muted-foreground mb-1">Mínimo</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={tempMin}
                    onChange={(e) => setTempMin(e.target.value)}
                    placeholder="Q 0"
                    className="h-11 w-full rounded-xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/50"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground mb-1">Máximo</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={tempMax}
                    onChange={(e) => setTempMax(e.target.value)}
                    placeholder="Q 100"
                    className="h-11 w-full rounded-xl border border-[#DECDBB] bg-white px-3 text-sm text-[#24140D] placeholder:text-[#8C522B]/50"
                  />
                </div>
              </div>

              {/* Botones de atajo rápido de precios */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'Hasta Q10', min: '', max: '10' },
                  { label: 'Q10 - Q30', min: '10', max: '30' },
                  { label: 'Q30+', min: '30', max: '' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setTempMin(preset.min)
                      setTempMax(preset.max)
                    }}
                    className="rounded-lg border border-[#DECDBB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6E5545] hover:border-primary hover:text-primary"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenación */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8C522B]">
                Ordenar por
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: '', label: 'Relevancia por defecto' },
                  { id: 'precio-asc', label: 'Menor precio primero' },
                  { id: 'precio-desc', label: 'Mayor precio primero' },
                  { id: 'nuevo', label: 'Novedades recientes' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTempSort(option.id)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                      tempSort === option.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#DECDBB] bg-white text-[#6E5545]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {tempSort === option.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de Acción en el Drawer */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#DECDBB]">
              <button
                type="button"
                onClick={resetDrawerFilters}
                className="flex-1 h-12 rounded-2xl border border-[#DECDBB] bg-white text-xs font-bold text-[#6E5545] transition-colors hover:bg-black/5"
              >
                Limpiar filtros
              </button>
              <Button
                type="button"
                onClick={applyDrawerFilters}
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 text-xs"
              >
                Aplicar filtros
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
