"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProductGrid } from "@/components/products/ProductGrid"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/products/CategoryBadge"
import { useToast } from "@/context/ToastContext"
import { productsService, categoriesService } from "@/lib/api"
import { apiProductToProduct } from "@/lib/api/transformers"
import type { Product } from "@/types"
import type { ApiCategory, ProductFilters } from "@/lib/api/types"

function ProductosContent() {
  const { addItem } = useCart()
  const { show } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Estado de productos
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Filtros
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sort, setSort] = useState<string>("relevancia")
  const [initialized, setInitialized] = useState(false)

  // Cargar categorías
  useEffect(() => {
    categoriesService.list()
      .then(setCategories)
      .catch(err => console.error('Error cargando categorías:', err))
  }, [])

  // Cargar productos
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const filters: ProductFilters = {}
      
      if (search.trim()) filters.search = search.trim()
      if (category) filters.category = category
      if (minPrice.trim()) filters.min = parseFloat(minPrice)
      if (maxPrice.trim()) filters.max = parseFloat(maxPrice)
      if (sort && sort !== 'relevancia') {
        filters.sort = sort as ProductFilters['sort']
      }
      
      const response = await productsService.list(filters)
      const transformedProducts = response.data.map(apiProductToProduct)
      setProducts(transformedProducts)
      setTotalProducts(response.meta.total)
    } catch (err) {
      console.error('Error cargando productos:', err)
      setError('Error al cargar productos. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [search, category, minPrice, maxPrice, sort])

  // Inicializar desde URL
  useEffect(() => {
    if (initialized) return
    
    const q = searchParams.get('q') ?? ''
    const cat = searchParams.get('cat')
    const min = searchParams.get('min') ?? ''
    const max = searchParams.get('max') ?? ''
    const s = searchParams.get('sort') ?? 'relevancia'

    setSearch(q)
    setCategory(cat && cat.length > 0 ? cat : null)
    setMinPrice(min)
    setMaxPrice(max)
    setSort(s)
    setInitialized(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cargar productos cuando cambian filtros
  useEffect(() => {
    if (!initialized) return
    fetchProducts()
  }, [initialized, fetchProducts])

  // Sincronizar URL con filtros
  useEffect(() => {
    if (!initialized) return
    
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (category) params.set('cat', category)
    if (minPrice.trim()) params.set('min', minPrice.trim())
    if (maxPrice.trim()) params.set('max', maxPrice.trim())
    if (sort && sort !== 'relevancia') params.set('sort', sort)

    const newQuery = params.toString()
    const currentQuery = searchParams.toString()
    if (newQuery !== currentQuery) {
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname)
    }
  }, [search, category, minPrice, maxPrice, sort, initialized, pathname, router, searchParams])

  const resetFilters = () => {
    setSearch("")
    setCategory(null)
    setMinPrice("")
    setMaxPrice("")
    setSort("relevancia")
  }

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      addItem(product, 1)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <p className="mt-1 text-gray-600">
          {isLoading ? 'Cargando...' : `${totalProducts} productos encontrados`}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
          <select
            value={category ?? ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio mín.</label>
            <input
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="0"
              type="number"
              min="0"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio máx.</label>
            <input
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="100"
              type="number"
              min="0"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Ordenar</label>
            <Button variant="link" size="sm" className="px-0" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value)} 
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nuevo">Novedades</option>
          </select>
        </div>
      </div>

      {/* Chips de categorías rápidas */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {categories.slice(0, 6).map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.slug)}>
            <CategoryBadge category={cat.slug} />
          </button>
        ))}
        {category && (
          <Button variant="ghost" onClick={() => setCategory(null)}>
            Limpiar categoría
          </Button>
        )}
      </div>

      {/* Estado de error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchProducts}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Grid de productos */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-lg bg-gray-200" />
              <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <ProductGrid
          products={products}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  )
}

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200 mb-4" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      </div>
    }>
      <ProductosContent />
    </Suspense>
  )
}
