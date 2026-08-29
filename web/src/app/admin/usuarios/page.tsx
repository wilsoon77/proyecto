"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users as UsersIcon, Plus, Search, Loader as Loader2, CreditCard as Edit, UserX, UserCheck, Shield, ShieldCheck, User as UserIcon, Building2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { usersService, type User, type UserRole } from "@/lib/api"
import { formatDateString } from "@/lib/utils"

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Gerente",
  BAKER: "Panadero",
  CUSTOMER: "Cliente",
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; icon: React.ElementType }> = {
  ADMIN: { bg: "bg-chart-5/10", text: "text-chart-5", icon: Shield },
  MANAGER: { bg: "bg-chart-3/10", text: "text-chart-3", icon: Shield },
  BAKER: { bg: "bg-primary/10", text: "text-primary", icon: Shield },
  CUSTOMER: { bg: "bg-muted", text: "text-foreground", icon: Shield },
}

export default function UsuariosPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
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

  useEffect(() => {
    let result = users
    
    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      )
    }
    
    // Filtro por rol
    if (roleFilter !== "ALL") {
      result = result.filter(user => user.role === roleFilter)
    }
    
    // Filtro por estado
    if (statusFilter === "ACTIVE") {
      result = result.filter(user => user.isActive)
    } else if (statusFilter === "INACTIVE") {
      result = result.filter(user => !user.isActive)
    }
    
    setFilteredUsers(result)
    setCurrentPage(1)
  }, [users, searchTerm, roleFilter, statusFilter])

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
      showToast("Usuario desactivado", "success")
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
      showToast("Usuario reactivado", "success")
    } catch (error) {
      console.error("Error reactivating user:", error)
      showToast("Error al reactivar usuario", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => formatDateString(dateString, {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B170F] flex items-center gap-3">
            <UsersIcon className="h-7 w-7 text-[#D97706]" />
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-[#6E5545] mt-1">Control de roles, accesos y personal de la panadería</p>
        </div>
        <Link href="/admin/usuarios/nuevo">
          <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>
          
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            className="px-3.5 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] cursor-pointer"
          >
            <option value="ALL">Todos los roles</option>
            <option value="CUSTOMER">Clientes</option>
            <option value="MANAGER">Gerentes</option>
            <option value="BAKER">Panaderos</option>
            <option value="ADMIN">Administradores</option>
          </select>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="px-3.5 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] cursor-pointer"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#E8DCCB] shadow-xs">
          <p className="text-[10px] font-bold text-[#8C522B] uppercase tracking-wider">Total Usuarios</p>
          <p className="font-display text-2xl font-bold text-[#2B170F] mt-1">{users.length}</p>
        </div>
        <div className="bg-[#FAF5EE] rounded-2xl p-4 border border-[#DECDBB] shadow-xs">
          <p className="text-[10px] font-bold text-[#8C522B] uppercase tracking-wider">Clientes</p>
          <p className="font-display text-2xl font-bold text-[#8C522B] mt-1">{users.filter(u => u.role === 'CUSTOMER').length}</p>
        </div>
        <div className="bg-[#FAF0E6] rounded-2xl p-4 border border-[#ECCDB5] shadow-xs">
          <p className="text-[10px] font-bold text-[#9E4D1A] uppercase tracking-wider">Equipo / Panaderos</p>
          <p className="font-display text-2xl font-bold text-[#D97706] mt-1">{users.filter(u => ['MANAGER', 'BAKER'].includes(u.role)).length}</p>
        </div>
        <div className="bg-[#2B170F] rounded-2xl p-4 border border-[#42261B] text-[#FAF5EE] shadow-xs">
          <p className="text-[10px] font-bold text-[#D49E6E] uppercase tracking-wider">Administradores</p>
          <p className="font-display text-2xl font-bold text-[#FBBF24] mt-1">{users.filter(u => u.role === 'ADMIN').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-[#D97706] animate-spin mx-auto" />
              <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando usuarios...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
              <UsersIcon className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-[#6E5545]">No se encontraron usuarios para esta búsqueda</p>
          </div>
        ) : (
          <>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#E8DCCB]">
            {paginatedUsers.map((user) => {
              const roleStyle = ROLE_COLORS[user.role]
              const RoleIcon = roleStyle.icon
              return (
                <div key={`m-${user.id}`} className={`p-4 hover:bg-[#FAF5EE]/40 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#FAF0E6] text-[#D97706] border border-[#DECDBB] flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#2B170F]">{user.firstName} {user.lastName}</p>
                        <p className="text-[11px] text-[#6E5545]">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/usuarios/${user.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#6E5545] hover:text-[#2B170F] hover:bg-[#FAF5EE]">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {user.isActive ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeactivateTarget(user)}
                          disabled={processingId === user.id}
                        >
                          {processingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleReactivate(user.id)}
                          disabled={processingId === user.id}
                        >
                          {processingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                      <RoleIcon className="h-3 w-3" />
                      {ROLE_LABELS[user.role]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {user.branch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5EE] border border-[#DECDBB] text-[#8C522B]">
                        <Building2 className="h-3 w-3" />
                        {user.branch.name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
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
                const RoleIcon = roleStyle.icon
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                        <RoleIcon className="h-3 w-3" />
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
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/usuarios/${user.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#6E5545] hover:text-[#2B170F] hover:bg-[#FAF5EE]" title="Editar usuario">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {user.isActive ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeactivateTarget(user)}
                            disabled={processingId === user.id}
                            title="Desactivar"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleReactivate(user.id)}
                            disabled={processingId === user.id}
                            title="Reactivar"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
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

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E8DCCB] bg-[#FAF5EE]/30">
            <p className="text-xs font-semibold text-[#8C522B]">
              Página {currentPage} de {totalPages} ({filteredUsers.length} usuarios)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-lg h-8 px-2.5 text-xs font-bold"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-lg h-8 px-2.5 text-xs font-bold"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Desactivar usuario"
        message={`¿Estás seguro de desactivar a ${deactivateTarget?.firstName} ${deactivateTarget?.lastName}? El usuario no podrá acceder al sistema.`}
        confirmText="Desactivar"
        variant="danger"
        isLoading={!!processingId}
      />
    </div>
  )
}
