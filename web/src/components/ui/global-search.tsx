"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  X, 
  Package, 
  ShoppingCart, 
  Users, 
  Building2, 
  Tag,
  Warehouse,
  Command,
  ArrowRight,
  Loader2
} from "lucide-react"
import { productsService, usersService, branchesService, categoriesService } from "@/lib/api"

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: "product" | "user" | "order" | "branch" | "category" | "page"
  href: string
  icon: React.ReactNode
}

// Páginas del sistema para búsqueda rápida
const PAGES: SearchResult[] = [
  { id: "page-dashboard", title: "Dashboard", subtitle: "Panel principal", type: "page", href: "/admin", icon: <Package className="h-4 w-4" /> },
  { id: "page-products", title: "Productos", subtitle: "Gestión de productos", type: "page", href: "/admin/productos", icon: <Package className="h-4 w-4" /> },
  { id: "page-orders", title: "Pedidos", subtitle: "Gestión de órdenes", type: "page", href: "/admin/ordenes", icon: <ShoppingCart className="h-4 w-4" /> },
  { id: "page-inventory", title: "Inventario", subtitle: "Stock por sucursal", type: "page", href: "/admin/inventario", icon: <Warehouse className="h-4 w-4" /> },
  { id: "page-categories", title: "Categorías", subtitle: "Gestión de categorías", type: "page", href: "/admin/categorias", icon: <Tag className="h-4 w-4" /> },
  { id: "page-branches", title: "Sucursales", subtitle: "Gestión de sucursales", type: "page", href: "/admin/sucursales", icon: <Building2 className="h-4 w-4" /> },
  { id: "page-users", title: "Usuarios", subtitle: "Gestión de usuarios", type: "page", href: "/admin/usuarios", icon: <Users className="h-4 w-4" /> },
  { id: "page-new-product", title: "Nuevo Producto", subtitle: "Crear producto", type: "page", href: "/admin/productos/nuevo", icon: <Package className="h-4 w-4" /> },
  { id: "page-new-movement", title: "Nuevo Movimiento", subtitle: "Registrar movimiento de inventario", type: "page", href: "/admin/inventario/movimiento", icon: <Warehouse className="h-4 w-4" /> },
]

const TYPE_ICONS: Record<string, React.ReactNode> = {
  product: <Package className="h-4 w-4 text-amber-600" />,
  user: <Users className="h-4 w-4 text-blue-600" />,
  order: <ShoppingCart className="h-4 w-4 text-green-600" />,
  branch: <Building2 className="h-4 w-4 text-purple-600" />,
  category: <Tag className="h-4 w-4 text-pink-600" />,
  page: <ArrowRight className="h-4 w-4 text-gray-400" />,
}

export function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Abrir/cerrar con Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Buscar cuando cambia el query
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Mostrar páginas sugeridas si no hay búsqueda
      setResults(PAGES.slice(0, 5))
      return
    }

    setIsLoading(true)
    const q = searchQuery.toLowerCase()

    try {
      // Buscar en páginas primero
      const pageResults = PAGES.filter(
        page => 
          page.title.toLowerCase().includes(q) || 
          page.subtitle?.toLowerCase().includes(q)
      )

      // Buscar en productos, usuarios, etc. en paralelo
      const [productsRes, usersRes, branchesRes, categoriesRes] = await Promise.allSettled([
        productsService.list({ search: searchQuery, pageSize: 5 }),
        usersService.list().then(users => 
          users.filter((u: any) => 
            u.firstName?.toLowerCase().includes(q) || 
            u.lastName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
          ).slice(0, 5)
        ),
        branchesService.list().then(branches =>
          branches.filter((b: any) => b.name?.toLowerCase().includes(q)).slice(0, 3)
        ),
        categoriesService.list().then(categories =>
          categories.filter((c: any) => c.name?.toLowerCase().includes(q)).slice(0, 3)
        ),
      ])

      const allResults: SearchResult[] = [...pageResults]

      // Productos
      if (productsRes.status === "fulfilled") {
        const products = productsRes.value.data || productsRes.value
        products.forEach((p: any) => {
          allResults.push({
            id: `product-${p.id}`,
            title: p.name,
            subtitle: `${p.category} • Q${p.price}`,
            type: "product",
            href: `/admin/productos/${p.id}`,
            icon: TYPE_ICONS.product,
          })
        })
      }

      // Usuarios
      if (usersRes.status === "fulfilled") {
        usersRes.value.forEach((u: any) => {
          allResults.push({
            id: `user-${u.id}`,
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.email,
            type: "user",
            href: `/admin/usuarios/${u.id}`,
            icon: TYPE_ICONS.user,
          })
        })
      }

      // Sucursales
      if (branchesRes.status === "fulfilled") {
        branchesRes.value.forEach((b: any) => {
          allResults.push({
            id: `branch-${b.id}`,
            title: b.name,
            subtitle: b.address,
            type: "branch",
            href: `/admin/sucursales/${b.id}`,
            icon: TYPE_ICONS.branch,
          })
        })
      }

      // Categorías
      if (categoriesRes.status === "fulfilled") {
        categoriesRes.value.forEach((c: any) => {
          allResults.push({
            id: `category-${c.id}`,
            title: c.name,
            subtitle: `${c.productCount || 0} productos`,
            type: "category",
            href: `/admin/categorias/${c.id}`,
            icon: TYPE_ICONS.category,
          })
        })
      }

      setResults(allResults.slice(0, 10))
      setSelectedIndex(0)
    } catch (error) {
      console.error("Error searching:", error)
      // En caso de error, mostrar solo las páginas filtradas
      const q = searchQuery.toLowerCase()
      const filteredPages = PAGES.filter(
        page => 
          page.title.toLowerCase().includes(q) || 
          page.subtitle?.toLowerCase().includes(q)
      )
      setResults(filteredPages)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, search])

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      navigateTo(results[selectedIndex].href)
    }
  }

  const navigateTo = (href: string) => {
    setIsOpen(false)
    setQuery("")
    router.push(href)
  }

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (resultsRef.current && results[selectedIndex]) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex, results])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300 font-mono">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal de búsqueda */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Input de búsqueda */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar productos, usuarios, páginas..."
              className="flex-1 text-base outline-none placeholder:text-gray-400"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Resultados */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 && query ? (
              <div className="py-12 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No se encontraron resultados</p>
              </div>
            ) : (
              results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => navigateTo(result.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex ? "bg-amber-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`p-2 rounded-lg ${
                    index === selectedIndex ? "bg-amber-100" : "bg-gray-100"
                  }`}>
                    {result.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.type === "page" ? "bg-gray-100 text-gray-600" :
                    result.type === "product" ? "bg-amber-100 text-amber-700" :
                    result.type === "user" ? "bg-blue-100 text-blue-700" :
                    result.type === "branch" ? "bg-purple-100 text-purple-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {result.type === "page" ? "Página" :
                     result.type === "product" ? "Producto" :
                     result.type === "user" ? "Usuario" :
                     result.type === "branch" ? "Sucursal" :
                     result.type === "category" ? "Categoría" : ""}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer con atajos */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Enter</kbd>
              ir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Esc</kbd>
              cerrar
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
