"use client"

import { Product } from "@/types"
import { ProductGrid } from "@/components/products/ProductGrid"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/products/CategoryBadge"
import { MOCK_PRODUCTS } from "@/lib/mock"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/context/ToastContext"

export default function ProductosPage() {
  const { addItem } = useCart()
  const { show } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sort, setSort] = useState<string>("relevancia")
  const [initialized, setInitialized] = useState(false)

  const resetFilters = () => {
    setSearch("")
    setCategory(null)
    setMinPrice("")
    setMaxPrice("")
    setSort("relevancia")
  }

  const filtered = useMemo(() => {
    let list = [...MOCK_PRODUCTS]
    if (category) list = list.filter(p => p.category === category)
    if (search.trim()) list = list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    )
  const min = parseFloat(minPrice)
  const max = parseFloat(maxPrice)
  if (!isNaN(min)) list = list.filter(p => p.price >= min)
  if (!isNaN(max)) list = list.filter(p => p.price <= max)

    if (sort === 'precio-asc') list.sort((a,b)=> (a.price)-(b.price))
    if (sort === 'precio-desc') list.sort((a,b)=> (b.price)-(a.price))
    if (sort === 'nuevo') list.sort((a,b)=> (b.isNew?1:0) - (a.isNew?1:0))
    if (sort === 'populares') list.sort((a,b)=> (b.reviewCount||0)-(a.reviewCount||0))
    return list
  }, [search, category, minPrice, maxPrice, sort])

  // Initialize state from URL on first render
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

  // Sync state to URL when filters change
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <p className="mt-1 text-gray-600">Explora nuestros panes, pasteles y más.</p>
      </div>

      {/* Filtros */}
  <div className="mb-8 grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Buscar</label>
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
          <select
            value={category ?? ''}
            onChange={(e)=>setCategory(e.target.value || null)}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Todas</option>
            <option value="pan">Pan</option>
            <option value="pasteles">Pasteles</option>
            <option value="galletas">Galletas</option>
            <option value="dulces">Dulces</option>
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio mín.</label>
            <input
              value={minPrice}
              onChange={e=>setMinPrice(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Precio máx.</label>
            <input
              value={maxPrice}
              onChange={e=>setMaxPrice(e.target.value)}
              placeholder="100"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Ordenar</label>
            <Button variant="link" size="sm" className="px-0" onClick={resetFilters}>Limpiar filtros</Button>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nuevo">Novedades</option>
            <option value="populares">Más populares</option>
          </select>
        </div>
      </div>

      {/* Chips de categorías rápidas */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {['pan','pasteles','galletas','dulces'].map(cat => (
          <button key={cat} onClick={()=> setCategory(cat)}>
            <CategoryBadge category={cat} />
          </button>
        ))}
        {category && (
          <Button variant="ghost" onClick={()=> setCategory(null)}>Limpiar categoría</Button>
        )}
      </div>

      <ProductGrid
        products={filtered}
        onAddToCart={(productId) => {
          const product = MOCK_PRODUCTS.find(p => p.id === productId)
          if (product) {
            addItem(product, 1)
            show(`Agregado: ${product.name}`)
          }
        }}
      />
    </div>
  )
}
