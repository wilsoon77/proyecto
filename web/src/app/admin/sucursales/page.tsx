"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, MapPin, Edit2, Trash2, Loader as Loader2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { branchesService } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

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

  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches
    const term = searchTerm.toLowerCase()
    return branches.filter((branch) =>
      branch.name.toLowerCase().includes(term) ||
      branch.address.toLowerCase().includes(term) ||
      branch.slug.toLowerCase().includes(term)
    )
  }, [branches, searchTerm])

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await branchesService.delete(deleteId)
      setBranches(branches.filter((b) => b.id !== deleteId))
      showToast("Sucursal eliminada o desactivada correctamente", "success")
    } catch (error: any) {
      console.error("Error deleting branch:", error)
      const msg = error?.message || "No se puede eliminar la sucursal porque tiene inventario u órdenes asociadas. Desactívala en su lugar."
      showToast(msg, "error")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Sucursales"
        description={`${branches.length} tiendas y puntos de venta activos para despacho e inventario`}
        icon={<MapPin className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[{ label: "Sucursales" }]}
        primaryAction={{
          label: "Nueva Sucursal",
          href: "/admin/sucursales/nuevo",
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
      />

      {/* ── Buscador Estandarizado ── */}
      <AdminSearchBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar por nombre, slug o dirección..."
        totalCount={branches.length}
        filteredCount={filteredBranches.length}
        entityName="sucursales"
        isLoading={isLoading}
      />

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#D97706] mx-auto" />
            <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando sucursales...</p>
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#2B170F] mb-1">
            {searchTerm ? "Sin resultados" : "No hay sucursales registradas"}
          </h3>
          <p className="text-xs text-[#6E5545] mb-6 max-w-md mx-auto">
            {searchTerm
              ? "No se encontraron sucursales que coincidan con la búsqueda."
              : "Crea tu primera sucursal para comenzar la operación de venta e inventario."}
          </p>
          {!searchTerm && (
            <Link href="/admin/sucursales/nuevo">
              <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs h-11 px-5">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sucursal
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <AdminEntityCard
              key={branch.id}
              image={
                <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
              }
              title={branch.name}
              subtitle={`/${branch.slug}`}
              meta={[
                {
                  label: "Dirección",
                  value: branch.address,
                },
                ...(branch.phone ? [{
                  label: "Teléfono",
                  value: branch.phone,
                }] : []),
              ]}
              actions={
                <>
                  <Link href={`/admin/sucursales/${branch.id}`} className="flex-1 sm:flex-none">
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
                    onClick={() => setDeleteId(branch.id)}
                    className="w-full sm:w-auto h-10 px-3.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Eliminar
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      {/* ── Diálogo de Confirmación ── */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar Sucursal"
        message="¿Estás seguro de que deseas eliminar o desactivar esta sucursal? Si tiene existencias registradas o ventas asociadas, se mantendrán protegidas por el sistema."
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />
    </div>
  )
}
