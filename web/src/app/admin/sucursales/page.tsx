"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, MapPin, Phone, Pencil, Trash2, Loader as Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { branchesService } from "@/lib/api"

interface Branch {
  id: number
  name: string
  slug: string
  address: string
  phone?: string
  createdAt: string
}

export default function SucursalesPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Protección de rol - solo ADMIN puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [currentUser, router])

  const loadBranches = async () => {
    try {
      const data = await branchesService.list()
      setBranches(data)
    } catch (error) {
      console.error("Error loading branches:", error)
      showToast("Error al cargar sucursales", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await branchesService.delete(deleteId)
      setBranches(branches.filter((b) => b.id !== deleteId))
      showToast("Sucursal eliminada correctamente", "success")
    } catch (error) {
      console.error("Error deleting branch:", error)
      showToast("Error al eliminar la sucursal", "error")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D97706] mx-auto" />
          <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando sucursales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#2B170F] font-display">Sucursales</h1>
          <p className="text-xs sm:text-sm text-[#6E5545] mt-1">{branches.length} sucursales activas en el sistema</p>
        </div>
        <Link href="/admin/sucursales/nuevo">
          <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sucursal
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
          <input
            type="text"
            placeholder="Buscar sucursales por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
          />
        </div>
      </div>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-[#2B170F] mb-1">
            {searchTerm ? "Sin resultados" : "No hay sucursales registradas"}
          </h3>
          <p className="text-xs text-[#6E5545] mb-4 max-w-md mx-auto">
            {searchTerm
              ? "No se encontraron sucursales que coincidan con la búsqueda."
              : "Crea tu primera sucursal para comenzar la operación."}
          </p>
          {!searchTerm && (
            <Link href="/admin/sucursales/nuevo">
              <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sucursal
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-5 sm:p-6 hover:border-[#D97706] hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#2B170F]">{branch.name}</h3>
                    <p className="text-xs text-[#6E5545] mt-0.5">{branch.address}</p>
                    {branch.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[#8C522B] mt-2 font-medium">
                        <Phone className="h-3.5 w-3.5" />
                        {branch.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link href={`/admin/sucursales/${branch.id}`}>
                    <Button variant="outline" size="sm" className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold shadow-xs">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(branch.id)}
                    className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-9 px-3 text-xs font-bold"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar Sucursal"
        message="¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer."
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />
    </div>
  )
}
