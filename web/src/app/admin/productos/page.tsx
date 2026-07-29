"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, CreditCard as Edit, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, X, Eye, EyeOff } from "lucide-react"
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
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
    if (currentUser && !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      router.push("/admin")
    }
  }, [currentUser, router])

  const loadProducts = useCallback(async (page: number = 1, search: string = "", status: 'all' | 'active' | 'inactive' = 'all') => {
    setIsLoading(true)
    try {
      const params: any = { 
        page, 
        pageSize: 10,
        status,
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

  const handleToggleActive = async (product: ApiProduct) => {
    try {
      await adminService.updateProduct(product.id, { isActive: !product.isActive })
      showToast(`Producto "${product.name}" ${product.isActive ? 'ocultado' : 'activado'}`, 'success')
      loadProducts(currentPage, searchQuery, statusFilter)
    } catch (error) {
      console.error('Error toggling product:', error)
      showToast('Error al cambiar visibilidad', 'error')
    }
  }

  // Initial load when filter changes
  useEffect(() => {
    loadProducts(1, searchQuery, statusFilter)
  }, [statusFilter, loadProducts])

  // Debounced search - auto search when user types (with 500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1, searchQuery, statusFilter)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, loadProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProducts(1, searchQuery, statusFilter)
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
      loadProducts(currentPage, searchQuery, statusFilter)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground mt-1">Gestiona el catálogo de productos</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Buscar productos... (búsqueda automática)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button type="submit" variant="outline" disabled={isLoading}>
            Buscar
          </Button>
        </form>

        {/* State filters tabs */}
        <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
              statusFilter === 'active'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
              statusFilter === 'inactive'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ocultos
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-border rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-border rounded w-1/3"></div>
                    <div className="h-3 bg-border rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No se encontraron productos para esta búsqueda" 
                : statusFilter === 'inactive' 
                ? "No hay productos ocultos" 
                : "No hay productos"}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link href="/admin/productos/nuevo">
                <Button className="mt-4 bg-primary hover:bg-primary/90">
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
                <div key={product.id} className="p-4 hover:bg-cream transition-colors">
                  <div className="flex items-start gap-3">
                    <ProductThumbnail
                      src={product.images?.[0]?.url}
                      alt={product.name}
                      category={product.categorySlug || product.category}
                      size={56}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium text-foreground truncate max-w-[120px]">{product.name}</p>
                        {!product.isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive">
                            Oculto
                          </span>
                        )}
                        {product.isNew && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-medium text-foreground text-sm">{formatPrice(product.basePrice)}</span>
                        <span className={`text-xs font-medium ${
                          (product.available || 0) > 10 ? "text-success" : 
                          (product.available || 0) > 0 ? "text-warning" : "text-destructive"
                        }`}>
                          Stock: {product.available || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/productos/${product.id}/editar`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 ${product.isActive ? 'text-muted-foreground hover:text-foreground' : 'text-primary hover:text-primary hover:bg-accent'}`}
                        onClick={() => handleToggleActive(product)}
                        title={product.isActive ? 'Ocultar producto' : 'Mostrar producto'}
                      >
                        {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <thead className="bg-cream border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Producto</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Categoría</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Precio</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-cream transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <ProductThumbnail
                            src={product.images?.[0]?.url}
                            alt={product.name}
                            category={product.categorySlug || product.category}
                            size={56}
                          />
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {formatPrice(product.basePrice)}
                        {product.comboQuantity && product.comboPrice ? (
                          <span className="block text-xs text-primary">{product.comboQuantity}x Q{Number(product.comboPrice).toFixed(2)}</span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (product.available || 0) > 10 ? "text-success" : 
                          (product.available || 0) > 0 ? "text-warning" : "text-destructive"
                        }`}>
                          {product.available || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!product.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                            Oculto
                          </span>
                        ) : !product.isAvailable ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            No disponible
                          </span>
                        ) : product.isNew ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                            Nuevo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                            Activo
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
                            className={product.isActive ? 'text-muted-foreground hover:text-foreground' : 'text-primary hover:text-primary'}
                            onClick={() => handleToggleActive(product)}
                            title={product.isActive ? 'Ocultar producto' : 'Mostrar producto'}
                          >
                            {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => loadProducts(currentPage - 1, searchQuery, statusFilter)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => loadProducts(currentPage + 1, searchQuery, statusFilter)}
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
