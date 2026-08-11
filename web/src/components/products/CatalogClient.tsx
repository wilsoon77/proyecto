'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader as Loader2 } from 'lucide-react'
import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryBadge } from '@/components/products/CategoryBadge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
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
  const [products, setProducts] = useState<Product[]>(() => initialCatalog.data.map(apiProductToProduct))
  const [currentPage, setCurrentPage] = useState(initialCatalog.meta.page)
  const [totalPages, setTotalPages] = useState(initialCatalog.meta.pageCount)
  const [totalProducts, setTotalProducts] = useState(initialCatalog.meta.total)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    setProducts(initialCatalog.data.map(apiProductToProduct))
    setCurrentPage(initialCatalog.meta.page)
    setTotalPages(initialCatalog.meta.pageCount)
    setTotalProducts(initialCatalog.meta.total)
  }, [initialCatalog])

  const handleAddToCart = (productId: number) => {
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
      const response = await productsService.list({
        ...filters,
        page: currentPage + 1,
        pageSize: filters.pageSize ?? 12,
      })
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

  const displayCount = products.length
  const progress = totalProducts > 0 ? Math.min((displayCount / totalProducts) * 100, 100) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Productos</h1>
        <p className="mt-1 text-muted-foreground">{totalProducts} productos encontrados</p>
      </div>

      <form action="/productos" method="get" className="mb-8 grid items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        {filters.branch && <input type="hidden" name="branch" value={filters.branch} />}
        <div>
          <label htmlFor="catalog-search" className="mb-1 block text-sm font-medium text-foreground">Buscar</label>
          <input
            id="catalog-search"
            name="q"
            defaultValue={filters.search ?? ''}
            placeholder="Buscar productos..."
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor="catalog-category" className="mb-1 block text-sm font-medium text-foreground">Categoría</label>
          <select
            id="catalog-category"
            name="cat"
            defaultValue={filters.category ?? ''}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="catalog-min" className="mb-1 block text-sm font-medium text-foreground">Precio mín.</label>
            <input id="catalog-min" name="min" defaultValue={filters.min ?? ''} placeholder="0" type="number" min="0" step="0.01" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
          </div>
          <div className="flex-1">
            <label htmlFor="catalog-max" className="mb-1 block text-sm font-medium text-foreground">Precio máx.</label>
            <input id="catalog-max" name="max" defaultValue={filters.max ?? ''} placeholder="100" type="number" min="0" step="0.01" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="catalog-sort" className="block text-sm font-medium text-foreground">Ordenar</label>
            <Button type="button" variant="link" size="sm" className="px-0" onClick={() => router.push('/productos')}>Limpiar filtros</Button>
          </div>
          <select id="catalog-sort" name="sort" defaultValue={filters.sort ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
            <option value="">Relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nuevo">Novedades</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
          <Button type="submit" className="shadow-warm">Aplicar filtros</Button>
        </div>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {categories.slice(0, 6).map((category) => (
          <button key={category.id} type="button" onClick={() => changeCategory(category.slug)}>
            <CategoryBadge category={category.slug} label={category.name} />
          </button>
        ))}
        {filters.category && <Button variant="ghost" onClick={() => changeCategory()}>Limpiar categoría</Button>}
      </div>

      <ProductGrid products={products} onAddToCart={handleAddToCart} />

      {products.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Mostrando {displayCount} de {totalProducts} productos</p>
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          {currentPage < totalPages && (
            <Button variant="outline" size="lg" onClick={loadMore} disabled={isLoadingMore} className="min-w-[200px]">
              {isLoadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</> : 'Cargar más productos'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
