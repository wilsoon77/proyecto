"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ProductThumbnail } from "@/components/ui/product-image"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { productsService, adminService } from "@/lib/api"
import type { ApiProduct } from "@/lib/api/types"
import { formatPrice } from "@/lib/utils"

export default function AdminProductosPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    productId: number | null
    productName: string
  }>({
    isOpen: false,
    productId: null,
    productName: ""
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // Protección de rol - solo ADMIN puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [currentUser, router])

  const loadProducts = useCallback(async (page: number = 1, search: string = "") => {
    setIsLoading(true)
    try {
      const params: Record<string, string | number> = { 
        page, 
        pageSize: 10,
      }
      if (search) {
        params.search = search
      }
      
      const response = await productsService.list(params)
      setProducts(response.data || [])
      setTotalPages(response.meta?.pageCount || 1)
      setCurrentPage(response.meta?.page || 1)
    } catch (error) {
      console.error("Error loading products:", error)
      showToast("Error al cargar los productos", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Initial load
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Debounced search - auto search when user types (with 500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1, searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, loadProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProducts(1, searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const openDeleteModal = (product: ApiProduct) => {
    setDeleteModal({
      isOpen: true,
      productId: product.id,
      productName: product.name
    })
  }

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, productId: null, productName: "" })
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.productId || isDeleting) return

    setIsDeleting(true)
    try {
      await adminService.deleteProduct(deleteModal.productId)
      showToast(`Producto "${deleteModal.productName}" eliminado correctamente`, "success")
      setDeleteModal({ isOpen: false, productId: null, productName: "" })
      loadProducts(currentPage, searchQuery)
    } catch (error) {
      console.error("Error deleting product:", error)
      showToast("Error al eliminar el producto. Puede que esté referenciado en órdenes.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Gestiona el catálogo de productos</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos... (búsqueda automática)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button type="submit" variant="outline" disabled={isLoading}>
            Buscar
          </Button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? "No se encontraron productos para esta búsqueda" : "No hay productos"}
            </p>
            {!searchQuery && (
              <Link href="/admin/productos/nuevo">
                <Button className="mt-4 bg-amber-600 hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer producto
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-gray-100">
              {products.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <ProductThumbnail
                      src={product.images?.[0]?.url}
                      alt={product.name}
                      category={product.categorySlug || product.category}
                      size={56}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
                        <span className={`text-sm font-medium ${
                          (product.available || 0) > 10 ? "text-green-600" : 
                          (product.available || 0) > 0 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          Stock: {product.available || 0}
                        </span>
                        {product.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Nuevo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/productos/${product.id}/editar`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteModal(product)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Producto</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Categoría</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Precio</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Estado</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <ProductThumbnail
                            src={product.images?.[0]?.url}
                            alt={product.name}
                            category={product.categorySlug || product.category}
                            size={56}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (product.available || 0) > 10 ? "text-green-600" : 
                          (product.available || 0) > 0 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {product.available || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.isNew ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Nuevo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/productos/${product.id}/editar`}>
                            <Button variant="ghost" size="sm" title="Editar producto">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteModal(product)}
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => loadProducts(currentPage - 1, searchQuery)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => loadProducts(currentPage + 1, searchQuery)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Eliminar producto"
        message={`¿Estás seguro de que quieres eliminar "${deleteModal.productName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  )
}
