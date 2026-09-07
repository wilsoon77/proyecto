"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users as UsersIcon, 
  Plus, 
  Loader as Loader2, 
  Edit2, 
  UserX, 
  UserCheck, 
  Shield, 
  Building2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { usersService, type User, type UserRole } from "@/lib/api"
import { formatDateString } from "@/lib/utils"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar, type FilterChip } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Gerente",
  BAKER: "Panadero",
  CUSTOMER: "Cliente",
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  MANAGER: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  BAKER: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800" },
  CUSTOMER: { bg: "bg-[#FAF5EE] border-[#DECDBB]", text: "text-[#6E5545]" },
}

export default function UsuariosPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)

  // Paginación
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)

  // Protección de rol - solo ADMIN puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [currentUser, router])

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await usersService.list()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      showToast("Error al cargar usuarios", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    const targetId = deactivateTarget.id
    
    setProcessingId(targetId)
    try {
      await usersService.deactivate(targetId)
      setUsers(prev => prev.map(u => 
        u.id === targetId ? { ...u, isActive: false } : u
      ))
      showToast(`Usuario "${deactivateTarget.firstName}" desactivado`, "success")
    } catch (error) {
      console.error("Error deactivating user:", error)
      const message = error instanceof Error ? error.message : "Error al desactivar usuario"
      showToast(message, "error")
    } finally {
      setProcessingId(null)
      setDeactivateTarget(null)
    }
  }

  const handleReactivate = async (userId: string) => {
    setProcessingId(userId)
    try {
      await usersService.reactivate(userId)
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: true } : u
      ))
      showToast("Usuario reactivado con éxito", "success")
    } catch (error) {
      console.error("Error reactivating user:", error)
      showToast("Error al reactivar usuario", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro por texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matches = 
          user.firstName.toLowerCase().includes(term) ||
          user.lastName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term)
        if (!matches) return false
      }

      // Filtro por rol
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false

      // Filtro por estado
      if (statusFilter === "ACTIVE" && !user.isActive) return false
      if (statusFilter === "INACTIVE" && user.isActive) return false

      return true
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [filteredUsers, currentPage])

  const filterChips: FilterChip[] = useMemo(() => {
    return [
      {
        id: "ALL",
        label: "Todos",
        count: users.length,
        active: roleFilter === "ALL",
        onClick: () => setRoleFilter("ALL"),
      },
      {
        id: "CUSTOMER",
        label: "Clientes",
        count: users.filter(u => u.role === "CUSTOMER").length,
        active: roleFilter === "CUSTOMER",
        onClick: () => setRoleFilter("CUSTOMER"),
      },
      {
        id: "BAKER",
        label: "Panaderos",
        count: users.filter(u => u.role === "BAKER").length,
        active: roleFilter === "BAKER",
        onClick: () => setRoleFilter("BAKER"),
      },
      {
        id: "MANAGER",
        label: "Gerentes",
        count: users.filter(u => u.role === "MANAGER").length,
        active: roleFilter === "MANAGER",
        onClick: () => setRoleFilter("MANAGER"),
      },
      {
        id: "ADMIN",
        label: "Admins",
        count: users.filter(u => u.role === "ADMIN").length,
        active: roleFilter === "ADMIN",
        onClick: () => setRoleFilter("ADMIN"),
      },
    ]
  }, [users, roleFilter])

  const formatDate = (dateString: string) => formatDateString(dateString, {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Gestión de Usuarios"
        description="Control de accesos, roles de empleados, panaderos y clientes de la tienda"
        icon={<UsersIcon className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[{ label: "Usuarios" }]}
        primaryAction={{
          label: "Nuevo Usuario",
          href: "/admin/usuarios/nuevo",
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
      />

      {/* ── Tarjetas KPI Resumen ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#E8DCCB] shadow-xs">
          <p className="text-[10px] font-bold text-[#8C522B] uppercase tracking-wider">Total Usuarios</p>
          <p className="font-display text-2xl font-bold text-[#2B170F] mt-1 font-mono">{users.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8DCCB] shadow-xs">
          <p className="text-[10px] font-bold text-[#8C522B] uppercase tracking-wider">Clientes</p>
          <p className="font-display text-2xl font-bold text-[#8C522B] mt-1 font-mono">{users.filter(u => u.role === 'CUSTOMER').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8DCCB] shadow-xs">
          <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">Equipo / Panadería</p>
          <p className="font-display text-2xl font-bold text-[#D97706] mt-1 font-mono">{users.filter(u => ['MANAGER', 'BAKER'].includes(u.role)).length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8DCCB] shadow-xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Activos</p>
          <p className="font-display text-2xl font-bold text-emerald-600 mt-1 font-mono">{users.filter(u => u.isActive).length}</p>
        </div>
      </div>

      {/* ── Buscador y Filtros Estandarizados ── */}
      <AdminSearchBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar por nombre, email o teléfono..."
        chips={filterChips}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
        entityName="usuarios"
        isLoading={isLoading}
      >
        {/* Selector de Estado */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8C522B] uppercase tracking-wider hidden sm:inline">
            Estado:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="h-10 px-3 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="INACTIVE">Solo Inactivos</option>
          </select>
        </div>
      </AdminSearchBar>

      {/* ── Contenido ── */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#D97706] mx-auto" />
              <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando usuarios...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
              <UsersIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[#2B170F] mb-1">
              No se encontraron usuarios
            </h3>
            <p className="text-xs text-[#6E5545] max-w-sm mx-auto">
              {searchTerm ? "Prueba con otro término de búsqueda o limpia los filtros." : "Comienza registrando a tu equipo de trabajo."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Vista Móvil: Tarjetas Estandarizadas ── */}
            <div className="md:hidden p-4 space-y-4">
              {paginatedUsers.map((user) => {
                const roleStyle = ROLE_COLORS[user.role]
                return (
                  <AdminEntityCard
                    key={`m-${user.id}`}
                    dimmed={!user.isActive}
                    image={
                      <div className="h-11 w-11 rounded-xl bg-[#FAF0E6] text-[#D97706] border border-[#E8DCCB] flex items-center justify-center font-bold text-xs">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                    }
                    title={`${user.firstName} ${user.lastName}`}
                    subtitle={user.email}
                    badges={
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text}`}>
                          <Shield className="h-3 w-3" />
                          {ROLE_LABELS[user.role]}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    }
                    meta={[
                      {
                        label: "Teléfono",
                        value: user.phone || "No registrado",
                      },
                      {
                        label: "Sucursal",
                        value: user.branch ? user.branch.name : "Todas / General",
                      },
                    ]}
                    actions={
                      <>
                        <Link href={`/admin/usuarios/${user.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-10 px-3.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                          >
                            <Edit2 className="h-4 w-4 mr-1.5 text-[#8C522B]" />
                            Editar
                          </Button>
                        </Link>

                        {user.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-3.5 border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs"
                            onClick={() => setDeactivateTarget(user)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserX className="h-4 w-4 mr-1" />
                            )}
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-3.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold text-xs"
                            onClick={() => handleReactivate(user.id)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-1" />
                            )}
                            Reactivar
                          </Button>
                        )}
                      </>
                    }
                  />
                )
              })}
            </div>

            {/* ── Vista Desktop: Tabla Limpia ── */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-[#FAF5EE] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider hidden xl:table-cell">Teléfono</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider hidden md:table-cell">Registro</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]">
                  {paginatedUsers.map((user) => {
                    const roleStyle = ROLE_COLORS[user.role]
                    return (
                      <tr key={user.id} className={`hover:bg-[#FAF5EE]/40 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#FAF0E6] text-[#D97706] border border-[#DECDBB] flex items-center justify-center font-bold text-xs">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-[#2B170F]">
                                {user.firstName} {user.lastName}
                              </p>
                              {user.orderCount !== undefined && (
                                <p className="text-[11px] text-[#8C522B]">{user.orderCount} órdenes</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-[#6E5545] hidden lg:table-cell font-mono">
                          {user.email}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-[#6E5545] hidden xl:table-cell">
                          {user.phone || "-"}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text}`}>
                            <Shield className="h-3 w-3" />
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap hidden lg:table-cell">
                          {user.branch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5EE] border border-[#DECDBB] text-[#8C522B]">
                              <Building2 className="h-3 w-3" />
                              {user.branch.name}
                            </span>
                          ) : (
                            <span className="text-[#8C522B]/60 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-[#8C522B] hidden md:table-cell">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/usuarios/${user.id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-2.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] text-xs font-bold">
                                <Edit2 className="h-3.5 w-3.5 mr-1 text-[#8C522B]" />
                                Editar
                              </Button>
                            </Link>
                            {user.isActive ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                                onClick={() => setDeactivateTarget(user)}
                                disabled={processingId === user.id}
                              >
                                {processingId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5 mr-1" />
                                )}
                                Desactivar
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs font-bold"
                                onClick={() => handleReactivate(user.id)}
                                disabled={processingId === user.id}
                              >
                                {processingId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                                )}
                                Reactivar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Paginación ── */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#E8DCCB] bg-[#FAF5EE]/30">
            <p className="text-xs font-semibold text-[#8C522B]">
              Página {currentPage} de {totalPages} ({filteredUsers.length} usuarios)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-xl h-8 px-3 text-xs font-bold"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-xl h-8 px-3 text-xs font-bold"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Dialog para Desactivar Usuario ── */}
      <ConfirmDialog
        isOpen={deactivateTarget !== null}
        title="Desactivar Usuario"
        message={`¿Estás seguro de que deseas desactivar la cuenta de "${deactivateTarget?.firstName} ${deactivateTarget?.lastName}"? El usuario no podrá iniciar sesión pero se preservará su historial de órdenes y auditoría.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
        variant="danger"
      />
    </div>
  )
}
