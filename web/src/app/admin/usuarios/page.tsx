"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Loader2,
  Edit,
  UserX,
  UserCheck,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { usersService, type User, type UserRole } from "@/lib/api"

const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "Cliente",
  EMPLOYEE: "Empleado",
  ADMIN: "Administrador",
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; icon: React.ElementType }> = {
  CUSTOMER: { bg: "bg-gray-100", text: "text-gray-700", icon: UserIcon },
  EMPLOYEE: { bg: "bg-blue-100", text: "text-blue-700", icon: Shield },
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700", icon: ShieldCheck },
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
  }, [users, searchTerm, roleFilter, statusFilter])

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

  const handleDeactivate = async (userId: string) => {
    if (!confirm("¿Estás seguro de desactivar este usuario?")) return
    
    setProcessingId(userId)
    try {
      await usersService.deactivate(userId)
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: false } : u
      ))
      showToast("Usuario desactivado", "success")
    } catch (error) {
      console.error("Error deactivating user:", error)
      const message = error instanceof Error ? error.message : "Error al desactivar usuario"
      showToast(message, "error")
    } finally {
      setProcessingId(null)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1">Administra los usuarios del sistema</p>
        </div>
        <Link href="/admin/usuarios/nuevo">
          <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="ALL">Todos los roles</option>
            <option value="CUSTOMER">Clientes</option>
            <option value="EMPLOYEE">Empleados</option>
            <option value="ADMIN">Administradores</option>
          </select>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Clientes</p>
          <p className="text-2xl font-bold text-gray-600">{users.filter(u => u.role === 'CUSTOMER').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Empleados</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'EMPLOYEE').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'ADMIN').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Registro</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const roleStyle = ROLE_COLORS[user.role]
                const RoleIcon = roleStyle.icon
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-700 font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.orderCount !== undefined && (
                            <p className="text-xs text-gray-400">{user.orderCount} órdenes</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden xl:table-cell">
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
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/usuarios/${user.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-amber-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {user.isActive ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 hover:text-red-600"
                            onClick={() => handleDeactivate(user.id)}
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
                            className="text-gray-600 hover:text-green-600"
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
        )}
      </div>
    </div>
  )
}
