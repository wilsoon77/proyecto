"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Tag,
  Package,
  Loader2
} from "lucide-react"
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
  }, [categories, searchTerm])

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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tag className="h-7 w-7 text-amber-600" />
            Categorías
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las categorías de productos</p>
        </div>
        <Link href="/admin/categorias/nuevo">
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No se encontraron categorías" : "No hay categorías"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "Intenta con otro término de búsqueda" 
              : "Crea tu primera categoría para organizar los productos"
            }
          </p>
          {!searchTerm && (
            <Link href="/admin/categorias/nuevo">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <div 
              key={category.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/categorias/${category.slug}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteTarget(category)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-500 mb-2 font-mono">/{category.slug}</p>
              
              {category.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
              )}
            </div>
          ))}
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
