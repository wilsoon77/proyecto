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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <UsersIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">Administra los usuarios del sistema</p>
        </div>
        <Link href="/admin/usuarios/nuevo">
          <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
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
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Clientes</p>
          <p className="text-2xl font-bold text-muted-foreground">{users.filter(u => u.role === 'CUSTOMER').length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Empleados</p>
          <p className="text-2xl font-bold text-chart-3">{users.filter(u => ['MANAGER', 'BAKER'].includes(u.role)).length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold text-chart-5">{users.filter(u => u.role === 'ADMIN').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </div>
        ) : (
          <>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {paginatedUsers.map((user) => {
              const roleStyle = ROLE_COLORS[user.role]
              const RoleIcon = roleStyle.icon
              return (
                <div key={`m-${user.id}`} className={`p-4 hover:bg-cream ${!user.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/usuarios/${user.id}`}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {user.isActive ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeactivateTarget(user)}
                          disabled={processingId === user.id}
                        >
                          {processingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-success"
                          onClick={() => handleReactivate(user.id)}
                          disabled={processingId === user.id}
                        >
                          {processingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                      <RoleIcon className="h-3 w-3" />
                      {ROLE_LABELS[user.role]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {user.branch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
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
          <table className="w-full">
            <thead className="bg-cream border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Registro</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user) => {
                const roleStyle = ROLE_COLORS[user.role]
                const RoleIcon = roleStyle.icon
                return (
                  <tr key={user.id} className={`hover:bg-cream ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.orderCount !== undefined && (
                            <p className="text-xs text-muted-foreground/60">{user.orderCount} órdenes</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden xl:table-cell">
                      {user.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                        <RoleIcon className="h-3 w-3" />
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      {user.branch ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          <Building2 className="h-3 w-3" />
                          {user.branch.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-success/10 text-success' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/usuarios/${user.id}`}>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {user.isActive ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeactivateTarget(user)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-success"
                            onClick={() => handleReactivate(user.id)}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
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
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({filteredUsers.length} usuarios)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
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
