"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, X, Eye, EyeOff, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ProductThumbnail } from "@/components/ui/product-image"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { productsService, adminService } from "@/lib/api"
import type { ApiProduct } from "@/lib/api/types"
import { formatPrice } from "@/lib/utils"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

export default function AdminProductosPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const canManageCatalog = currentUser?.role === 'ADMIN'
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
      
      const response = await productsService.listAdmin(params)
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
      showToast("No se puede eliminar porque este producto tiene ventas registradas en el historial. Puedes ocultarlo de la tienda web para darlo de baja de forma segura.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Estandarizado */}
      <AdminPageHeader
        title="Productos"
        description="Gestión del catálogo, precios de venta y visibilidad en la tienda e-commerce"
        icon={Package}
        action={
          canManageCatalog
            ? {
                label: "Nuevo Producto",
                href: "/admin/productos/nuevo",
                icon: Plus,
              }
            : undefined
        }
      />

      {/* Búsqueda y Filtros Táctiles Estandarizados */}
      <AdminSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        placeholder="Buscar productos por nombre..."
        chips={[
          {
            id: "all",
            label: "Todos",
            active: statusFilter === "all",
            onClick: () => setStatusFilter("all"),
          },
          {
            id: "active",
            label: "Activos en Web",
            active: statusFilter === "active",
            onClick: () => setStatusFilter("active"),
          },
          {
            id: "inactive",
            label: "Ocultos de la Web",
            active: statusFilter === "inactive",
            onClick: () => setStatusFilter("inactive"),
          },
        ]}
        filteredCount={products.length}
        entityName="productos en esta página"
        isLoading={isLoading}
      />

      {/* Products Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-[#FAF5EE] rounded-xl border border-[#E8DCCB]"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#FAF5EE] rounded-md w-1/3"></div>
                    <div className="h-3 bg-[#FAF5EE] rounded-md w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
              <ImageIcon className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-[#6E5545]">
              {searchQuery 
                ? "No se encontraron productos para esta búsqueda" 
                : statusFilter === 'inactive' 
                ? "No hay productos ocultos" 
                : "No hay productos en el catálogo"}
            </p>
            {!searchQuery && statusFilter === 'all' && canManageCatalog && (
              <Link href="/admin/productos/nuevo">
                <Button className="mt-4 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer producto
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card Layout Estandarizado */}
            <div className="md:hidden p-4 space-y-3">
              {products.map((product) => (
                <AdminEntityCard
                  key={product.id}
                  dimmed={!product.isActive}
                  image={
                    <ProductThumbnail
                      src={product.images?.[0]?.url}
                      alt={product.name}
                      category={product.categorySlug || product.category}
                      size={56}
                    />
                  }
                  title={product.name}
                  subtitle={
                    <span>
                      {product.category}
                      {product.origin && (
                        <span className="text-[#8C522B]"> · {product.origin === "PRODUCIDO" ? "Panadería" : "Reventa"}</span>
                      )}
                    </span>
                  }
                  badges={
                    <>
                      {!product.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Oculto en Web
                        </span>
                      ) : !product.isAvailable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#9E4D1A] border border-amber-200">
                          No disponible
                        </span>
                      ) : product.isNew ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#9E4D1A] border border-amber-200">
                          Nuevo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activo en Web
                        </span>
                      )}
                    </>
                  }
                  meta={[
                    {
                      label: "Precio Base",
                      value: formatPrice(product.basePrice),
                    },
                    {
                      label: "Stock Vendible",
                      value: `${product.available || 0} uds`,
                      highlight: (product.available || 0) > 0,
                      alert: (product.available || 0) === 0,
                    },
                  ]}
                  actions={
                    canManageCatalog && (
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        <Link href={`/admin/productos/${product.id}/editar`} className="flex-1 min-w-[90px]">
                          <button
                            type="button"
                            className="w-full h-10 px-3 bg-white border border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl font-bold text-xs shadow-2xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#8C522B]" />
                            <span>Editar</span>
                          </button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          className={`flex-1 min-w-[110px] h-10 px-3 border rounded-xl font-bold text-xs shadow-2xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            product.isActive
                              ? "bg-white border-[#DECDBB] text-[#6E5545] hover:bg-[#FAF5EE] hover:text-[#2B170F]"
                              : "bg-[#FAF0E6] border-[#DECDBB] text-[#D97706] hover:bg-amber-100"
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-[#8C522B]" />
                              <span>Ocultar Web</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 text-[#D97706]" />
                              <span>Mostrar Web</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(product)}
                          className="h-10 px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )
                  }
                />
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF5EE] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail
                            src={product.images?.[0]?.url}
                            alt={product.name}
                            category={product.categorySlug || product.category}
                            size={48}
                          />
                          <div>
                            <p className="font-bold text-xs text-[#2B170F]">{product.name}</p>
                            <p className="text-[11px] text-[#8C522B] font-mono">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#FAF5EE] border border-[#DECDBB] text-[#6E5545]">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-xs text-[#2B170F]">
                        {formatPrice(product.basePrice)}
                        {product.comboQuantity && product.comboPrice ? (
                          <span className="block text-[11px] text-[#D97706] font-normal">{product.comboQuantity}x Q{Number(product.comboPrice).toFixed(2)}</span>
                        ) : null}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-bold ${
                          (product.available || 0) > 10 ? "text-emerald-700" : 
                          (product.available || 0) > 0 ? "text-[#D97706]" : "text-red-700"
                        }`}>
                          {product.available || 0} uds
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {!product.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Oculto
                          </span>
                        ) : !product.isAvailable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#9E4D1A] border border-amber-200">
                            No disponible
                          </span>
                        ) : product.isNew ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#9E4D1A] border border-amber-200">
                            Nuevo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {canManageCatalog && (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <Link href={`/admin/productos/${product.id}/editar`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] text-xs font-bold"
                                title="Editar producto"
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-1 text-[#8C522B]" />
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-8 px-2.5 text-xs font-bold ${
                                product.isActive
                                  ? "border-[#DECDBB] text-[#6E5545] hover:bg-[#FAF5EE] hover:text-[#2B170F]"
                                  : "border-amber-200 bg-[#FAF0E6] text-[#D97706] hover:bg-amber-100"
                              }`}
                              onClick={() => handleToggleActive(product)}
                              title={product.isActive ? "Ocultar producto de la tienda web" : "Mostrar producto en la tienda web"}
                            >
                              {product.isActive ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 mr-1 text-[#8C522B]" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 mr-1 text-[#D97706]" />
                                  Mostrar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold"
                              onClick={() => openDeleteModal(product)}
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E8DCCB] bg-[#FAF5EE]/30">
                <p className="text-xs font-semibold text-[#8C522B]">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => loadProducts(currentPage - 1, searchQuery, statusFilter)}
                    className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-lg h-8 px-2.5 text-xs font-bold"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => loadProducts(currentPage + 1, searchQuery, statusFilter)}
                    className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-lg h-8 px-2.5 text-xs font-bold"
                  >
                    Siguiente <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
