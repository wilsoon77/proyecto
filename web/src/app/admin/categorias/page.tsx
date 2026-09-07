"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Edit2, Trash2, Tag, Package, Loader as Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { categoriesService } from "@/lib/api"
import type { ApiCategory } from "@/lib/api/types"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar, type FilterChip } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

type StatusFilter = "all" | "active" | "inactive"

export default function AdminCategoriasPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
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

  // Filtrado memoizado
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Búsqueda por texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesText =
          cat.name.toLowerCase().includes(term) ||
          cat.slug.toLowerCase().includes(term) ||
          (cat.description && cat.description.toLowerCase().includes(term))
        if (!matchesText) return false
      }

      // Filtro de estado
      if (statusFilter === "active" && cat.isActive === false) return false
      if (statusFilter === "inactive" && cat.isActive !== false) return false

      return true
    })
  }, [categories, searchTerm, statusFilter])

  // Reset de página al filtrar o buscar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE))
  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [filteredCategories, currentPage])

  // Contadores para chips
  const activeCount = useMemo(() => categories.filter(c => c.isActive !== false).length, [categories])
  const inactiveCount = useMemo(() => categories.filter(c => c.isActive === false).length, [categories])

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [
      {
        id: "all",
        label: "Todas",
        count: categories.length,
        active: statusFilter === "all",
        onClick: () => setStatusFilter("all"),
      },
      {
        id: "active",
        label: "Activas",
        count: activeCount,
        active: statusFilter === "active",
        onClick: () => setStatusFilter("active"),
      },
    ]

    if (inactiveCount > 0) {
      chips.push({
        id: "inactive",
        label: "Inactivas",
        count: inactiveCount,
        active: statusFilter === "inactive",
        onClick: () => setStatusFilter("inactive"),
      })
    }

    return chips
  }, [categories.length, activeCount, inactiveCount, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await categoriesService.delete(deleteTarget.slug)
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      showToast(`Categoría "${deleteTarget.name}" eliminada o desactivada correctamente`, "success")
    } catch (error: any) {
      console.error("Error deleting category:", error)
      const msg = error?.message || "No se puede eliminar la categoría porque tiene productos vinculados. Desactívala en su lugar."
      showToast(msg, "error")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Categorías"
        description="Organización y clasificación del catálogo de productos y repostería"
        icon={<Tag className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[{ label: "Categorías" }]}
        primaryAction={{
          label: "Nueva Categoría",
          href: "/admin/categorias/nuevo",
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
      />

      {/* ── Buscador y Filtros ── */}
      <AdminSearchBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar categorías por nombre o slug..."
        chips={filterChips}
        totalCount={categories.length}
        filteredCount={filteredCategories.length}
        entityName="categorías"
        isLoading={isLoading}
      />

      {/* ── Contenido ── */}
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
          <h3 className="text-base font-bold text-[#2B170F] mb-1">
            {searchTerm ? "No se encontraron categorías" : "No hay categorías registradas"}
          </h3>
          <p className="text-xs text-[#6E5545] mb-6 max-w-md mx-auto">
            {searchTerm 
              ? "Intenta con otro término de búsqueda o limpia el filtro." 
              : "Crea tu primera categoría para organizar panes, galletas y bebidas en la tienda."
            }
          </p>
          {!searchTerm && (
            <Link href="/admin/categorias/nuevo">
              <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs h-11 px-5">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCategories.map((category) => {
            const isInactive = category.isActive === false

            return (
              <AdminEntityCard
                key={category.id}
                dimmed={isInactive}
                image={
                  <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                }
                title={category.name}
                subtitle={`/${category.slug}`}
                badges={
                  isInactive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                      Inactiva
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Activa
                    </span>
                  )
                }
                meta={[
                  ...(category.productCount !== undefined
                    ? [{ label: "Productos", value: `${category.productCount} asociados` }]
                    : []),
                  ...(category.description
                    ? [{ label: "Descripción", value: category.description }]
                    : []),
                ]}
                actions={
                  <>
                    <Link href={`/admin/categorias/${category.slug}`} className="flex-1 sm:flex-none">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto h-10 px-3.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                      >
                        <Edit2 className="h-4 w-4 mr-1.5 text-[#8C522B]" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(category)}
                      className="w-full sm:w-auto h-10 px-3.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Eliminar
                    </Button>
                  </>
                }
              />
            )
          })}
        </div>
      )}

      {/* ── Paginación ── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl shadow-xs border border-[#E8DCCB] px-6 py-4">
          <p className="text-xs font-semibold text-[#8C522B]">
            Página {currentPage} de {totalPages} ({filteredCategories.length} categorías)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold"
            >
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Diálogo de Confirmación ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría "${deleteTarget?.name}"? Si tiene productos asociados, no se podrá eliminar para proteger el catálogo.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
