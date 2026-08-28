"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, CreditCard as Edit, Trash2, Tag, Package, Loader as Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { categoriesService } from "@/lib/api"
import type { ApiCategory } from "@/lib/api/types"

export default function AdminCategoriasPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Paginación
  const ITEMS_PER_PAGE = 12
  const [currentPage, setCurrentPage] = useState(1)

  // Protección de rol - solo ADMIN puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [currentUser, router])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      setFilteredCategories(
        categories.filter(cat => 
          cat.name.toLowerCase().includes(term) ||
          cat.slug.toLowerCase().includes(term)
        )
      )
    } else {
      setFilteredCategories(categories)
    }
    setCurrentPage(1)
  }, [categories, searchTerm])

  // Paginación
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE)
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const data = await categoriesService.list()
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
      showToast("Error al cargar categorías", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    
    setIsDeleting(true)
    try {
      await categoriesService.delete(deleteTarget.slug)
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      showToast("Categoría eliminada", "success")
    } catch (error) {
      console.error("Error deleting category:", error)
      showToast("Error al eliminar. Puede tener productos asociados.", "error")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#2B170F] font-display flex items-center gap-3">
            <Tag className="h-7 w-7 text-[#D97706]" />
            Categorías
          </h1>
          <p className="text-xs sm:text-sm text-[#6E5545] mt-1">Organización y clasificación del catálogo</p>
        </div>
        <Link href="/admin/categorias/nuevo">
          <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
          <input
            type="text"
            placeholder="Buscar categorías por nombre o slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#D97706] mx-auto" />
            <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando categorías...</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
            <Tag className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-[#2B170F] mb-1">
            {searchTerm ? "No se encontraron categorías" : "No hay categorías registradas"}
          </h3>
          <p className="text-xs text-[#6E5545] mb-4 max-w-md mx-auto">
            {searchTerm 
              ? "Intenta con otro término de búsqueda" 
              : "Crea tu primera categoría para organizar los panes, galletas y bebidas."
            }
          </p>
          {!searchTerm && (
            <Link href="/admin/categorias/nuevo">
              <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCategories.map((category) => (
            <div 
              key={category.id}
              className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-5 hover:border-[#D97706] hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/categorias/${category.slug}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#6E5545] hover:text-[#2B170F] hover:bg-[#FAF5EE]" title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteTarget(category)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-bold text-xs sm:text-sm text-[#2B170F] mb-0.5">{category.name}</h3>
              <p className="text-[11px] text-[#8C522B] mb-2 font-mono">/{category.slug}</p>
              
              {category.description && (
                <p className="text-xs text-[#6E5545] line-clamp-2">{category.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xs border border-[#E8DCCB] px-6 py-3.5">
          <p className="text-xs font-semibold text-[#8C522B]">
            Página {currentPage} de {totalPages} ({filteredCategories.length} categorías)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-lg h-8 px-2.5 text-xs font-bold"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-lg h-8 px-2.5 text-xs font-bold"
            >
              Siguiente <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría "${deleteTarget?.name}"? Esta acción no se puede deshacer. Los productos asociados quedarán sin categoría.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
