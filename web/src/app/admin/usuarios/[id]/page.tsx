"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader as Loader2, Eye, EyeOff, UserX, UserCheck, Building2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { usersService, branchesService, type User as ApiUser, type UserRole, ApiClientError } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminStickyFooter } from "@/components/admin/AdminStickyFooter"

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
  
  const [user, setUser] = useState<ApiUser | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
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
    if (['MANAGER', 'BAKER'].includes(role) && !branchId) {
      setError("Los gerentes y panaderos deben tener una sucursal asignada")
      return
    }

    setIsSaving(true)

    try {
      const updateData: Parameters<typeof usersService.update>[1] = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
        branchId: ['MANAGER', 'BAKER'].includes(role) ? branchId : null,
      }

      if (password) {
        updateData.password = password
      }

      await usersService.update(userId, updateData)

      showToast(`Usuario "${firstName} ${lastName}" actualizado con éxito`, "success")
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
    setIsDeactivating(true)
    try {
      await usersService.deactivate(userId)
      showToast("Usuario desactivado correctamente", "success")
      router.push("/admin/usuarios")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al desactivar usuario"
      showToast(message, "error")
    } finally {
      setIsDeactivating(false)
      setShowDeactivateDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#D97706] animate-spin mx-auto" />
          <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <p className="text-center text-[#8C522B]">Usuario no encontrado</p>
        <Link href="/admin/usuarios" className="mt-4 block text-center">
          <Button variant="outline" className="border-[#DECDBB]">Volver a usuarios</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-24">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title={`Editar: ${user.firstName} ${user.lastName}`}
        description={`Modifica rol, datos de contacto y sucursal de ${user.email}`}
        breadcrumbs={[
          { label: "Usuarios", href: "/admin/usuarios" },
          { label: `Editar #${user.id.slice(0, 8)}` },
        ]}
        secondaryAction={
          user.isActive
            ? {
                label: "Desactivar",
                onClick: () => setShowDeactivateDialog(true),
                icon: <UserX className="h-4 w-4 mr-1.5" />,
              }
            : undefined
        }
      />

      {/* Status Alert if Inactive */}
      {!user.isActive && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 text-sm font-semibold">
            <UserX className="h-5 w-5" />
            <span>Esta cuenta está actualmente desactivada</span>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold"
            onClick={async () => {
              await usersService.reactivate(userId)
              showToast("Usuario reactivado con éxito", "success")
              loadData()
            }}
          >
            <UserCheck className="h-4 w-4 mr-1.5" />
            Reactivar Cuenta
          </Button>
        </div>
      )}

      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Icon Badge Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF5EE] border border-[#DECDBB]/60">
            <div className="h-14 w-14 rounded-2xl bg-[#FAF0E6] text-[#D97706] border border-[#E8DCCB] flex items-center justify-center font-bold text-base shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B170F]">
                {firstName} {lastName}
              </p>
              <p className="text-xs text-[#8C522B] font-mono mt-0.5">{email}</p>
            </div>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
                Nombre *
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
                Apellido *
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+502 1234-5678"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Rol de Acceso *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole)
                if (!['MANAGER', 'BAKER'].includes(e.target.value)) {
                  setBranchId(undefined)
                }
              }}
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            >
              <option value="CUSTOMER">Cliente</option>
              <option value="MANAGER">Gerente</option>
              <option value="BAKER">Panadero</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* Branch (solo para roles operativos) */}
          {['MANAGER', 'BAKER'].includes(role) && (
            <div>
              <label htmlFor="branch" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
                <Building2 className="inline-block h-3.5 w-3.5 mr-1 text-[#D97706]" />
                Sucursal Asignada *
              </label>
              <select
                id="branch"
                value={branchId || ""}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
                required
              >
                <option value="">Seleccionar sucursal...</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-[#8C522B] mt-1.5">
                El empleado operará el inventario y hornadas de esta sucursal.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#E8DCCB] pt-4">
            <h3 className="text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-1">Cambiar Contraseña</h3>
            <p className="text-[11px] text-[#8C522B] mb-4">Deja en blanco si no deseas modificar la contraseña del usuario</p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2.5 pr-10 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C522B] hover:text-[#2B170F]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {password && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
              />
            </div>
          )}
        </div>

        {/* ── Barra Fija de Acciones Inferior ── */}
        <AdminStickyFooter
          primaryLabel="Guardar Cambios"
          isPrimarySubmitting={isSaving}
          secondaryLabel="Cancelar"
          secondaryHref="/admin/usuarios"
        />
      </form>

      {/* ── Diálogo de Confirmación para Desactivar ── */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onCancel={() => setShowDeactivateDialog(false)}
        onConfirm={handleDeactivate}
        title="Desactivar Usuario"
        message={`¿Estás seguro de desactivar a ${user.firstName} ${user.lastName}? El usuario ya no podrá ingresar al sistema pero su historial quedará preservado.`}
        confirmText="Desactivar"
        variant="danger"
        isLoading={isDeactivating}
      />
    </div>
  )
}
