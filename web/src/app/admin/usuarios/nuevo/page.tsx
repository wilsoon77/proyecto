"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Building2, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { usersService, branchesService, type UserRole, ApiClientError } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminStickyFooter } from "@/components/admin/AdminStickyFooter"

interface Branch {
  id: number
  name: string
  slug: string
}

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  
  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("CUSTOMER")
  const [branchId, setBranchId] = useState<number | undefined>(undefined)

  // Cargar sucursales
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await branchesService.list()
        setBranches(data)
      } catch (err) {
        console.error("Error loading branches:", err)
      }
    }
    loadBranches()
  }, [])

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
    if (!password) {
      setError("La contraseña es requerida")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (['MANAGER', 'BAKER'].includes(role) && !branchId) {
      setError("Los gerentes y panaderos deben tener una sucursal asignada")
      return
    }

    setIsLoading(true)

    try {
      await usersService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role,
        branchId: ['MANAGER', 'BAKER'].includes(role) ? branchId : undefined,
      })

      showToast(`Usuario "${firstName.trim()} ${lastName.trim()}" creado correctamente`, "success")
      router.push("/admin/usuarios")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al crear el usuario. Verifica que el correo no esté ya registrado.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-24">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Nuevo Usuario"
        description="Crea una cuenta para administradores, empleados, panaderos o clientes"
        breadcrumbs={[
          { label: "Usuarios", href: "/admin/usuarios" },
          { label: "Nuevo Usuario" },
        ]}
      />

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
            <div className="h-14 w-14 bg-[#FAF0E6] text-[#D97706] rounded-2xl flex items-center justify-center shrink-0 border border-[#E8DCCB]">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B170F]">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Nombre completo"}
              </p>
              <p className="text-xs text-[#8C522B] font-mono mt-0.5">
                {email || "correo@ejemplo.com"}
              </p>
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
              Teléfono (Opcional)
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
            <p className="text-[11px] text-[#8C522B] mt-1.5">
              {role === 'CUSTOMER' && 'Puede ver productos y realizar pedidos en línea.'}
              {role === 'MANAGER' && 'Acceso total a inventario y operaciones de su sucursal asignada.'}
              {role === 'BAKER' && 'Acceso enfocado a hornadas, recetas y consumo de materia prima.'}
              {role === 'ADMIN' && 'Control total de configuración, finanzas, usuarios y catálogo.'}
            </p>
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
                El empleado operará directamente sobre el inventario y hornadas de esta sucursal.
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Contraseña *
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
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Confirmar Contraseña *
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
        </div>

        {/* ── Barra Fija de Acciones Inferior ── */}
        <AdminStickyFooter
          primaryLabel="Crear Usuario"
          isPrimarySubmitting={isLoading}
          secondaryLabel="Cancelar"
          secondaryHref="/admin/usuarios"
        />
      </form>
    </div>
  )
}
