"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Trash2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { usersService, branchesService, type User, type UserRole, ApiClientError } from "@/lib/api"

interface Branch {
  id: number
  name: string
  slug: string
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { showToast } = useToast()
  
  const [user, setUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("CUSTOMER")
  const [branchId, setBranchId] = useState<number | undefined>(undefined)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [userData, branchesData] = await Promise.all([
        usersService.getById(userId),
        branchesService.list()
      ])
      setUser(userData)
      setBranches(branchesData)
      setFirstName(userData.firstName)
      setLastName(userData.lastName)
      setEmail(userData.email)
      setPhone(userData.phone || "")
      setRole(userData.role)
      setBranchId(userData.branchId || undefined)
    } catch (error) {
      console.error("Error loading user:", error)
      showToast("Error al cargar usuario", "error")
      router.push("/admin/usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!firstName.trim()) {
      setError("El nombre es requerido")
      return
    }
    if (!lastName.trim()) {
      setError("El apellido es requerido")
      return
    }
    if (!email.trim()) {
      setError("El email es requerido")
      return
    }
    // Solo validar contraseña si se está cambiando
    if (password) {
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres")
        return
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }
    }
    if (role === "EMPLOYEE" && !branchId) {
      setError("Debe seleccionar una sucursal para el empleado")
      return
    }

    setIsSaving(true)

    try {
      const updateData: {
        firstName: string
        lastName: string
        email: string
        phone?: string
        role: UserRole
        password?: string
        branchId?: number | null
      } = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
        branchId: role === "EMPLOYEE" ? branchId : null,
      }
      
      // Solo enviar password si se cambió
      if (password) {
        updateData.password = password
      }

      await usersService.update(userId, updateData)

      showToast(`Usuario "${firstName} ${lastName}" actualizado correctamente`, "success")
      router.push("/admin/usuarios")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al actualizar el usuario")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm("¿Estás seguro de desactivar este usuario?")) return
    
    try {
      await usersService.deactivate(userId)
      showToast("Usuario desactivado", "success")
      router.push("/admin/usuarios")
    } catch (error: any) {
      showToast(error.message || "Error al desactivar usuario", "error")
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-center text-gray-500">Usuario no encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/usuarios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
        {user.isActive && (
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDeactivate}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Desactivar
          </Button>
        )}
      </div>

      {/* Status Badge */}
      {!user.isActive && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">Este usuario está desactivado</p>
          <Button 
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50"
            onClick={async () => {
              await usersService.reactivate(userId)
              showToast("Usuario reactivado", "success")
              loadUser()
            }}
          >
            Reactivar
          </Button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+502 1234-5678"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rol *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole)
                if (e.target.value !== "EMPLOYEE") {
                  setBranchId(undefined)
                }
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="CUSTOMER">Cliente</option>
              <option value="EMPLOYEE">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'CUSTOMER' && 'Puede ver productos y realizar pedidos'}
              {role === 'EMPLOYEE' && 'Puede gestionar pedidos e inventario de su sucursal'}
              {role === 'ADMIN' && 'Acceso completo al sistema'}
            </p>
          </div>

          {/* Branch (solo para EMPLOYEE) */}
          {role === "EMPLOYEE" && (
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline-block h-4 w-4 mr-1" />
                Sucursal Asignada *
              </label>
              <select
                id="branch"
                value={branchId || ""}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                <option value="">Seleccionar sucursal...</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                El empleado solo podrá ver y gestionar el inventario de esta sucursal
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Cambiar Contraseña</h3>
            <p className="text-xs text-gray-500 mb-4">Deja en blanco si no deseas cambiar la contraseña</p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {password && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/admin/usuarios">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-amber-600 hover:bg-amber-700"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
