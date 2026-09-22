"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, Loader as Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/toast"
import { branchesService, ApiClientError } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminStickyFooter } from "@/components/admin/AdminStickyFooter"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function NuevaSucursalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const returnUrlParam = searchParams.get("returnUrl")
  const [returnUrl, setReturnUrl] = useState<string>("/admin/sucursales")

  useEffect(() => {
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam)
    } else {
      try {
        const saved = sessionStorage.getItem("admin_sucursales_return_url")
        if (saved) setReturnUrl(saved)
      } catch {}
    }
  }, [returnUrlParam])
  
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [slug, setSlug] = useState("")
  const [phone, setPhone] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("El nombre de la sucursal es requerido")
      return
    }
    if (!address.trim()) {
      setError("La dirección es requerida")
      return
    }
    if (!slug.trim()) {
      setError("El slug URL es requerido")
      return
    }

    setIsLoading(true)

    try {
      await branchesService.create({
        name: name.trim(),
        address: address.trim(),
        slug: slug.trim(),
        phone: phone.trim() || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      showToast(`Sucursal "${name.trim()}" creada correctamente`, "success")
      router.push(returnUrl)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al crear la sucursal. Verifica que el slug no esté repetido.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Nueva Sucursal"
        description="Registra una nueva tienda física o punto de venta e inventario"
        breadcrumbs={[
          { label: "Sucursales", href: returnUrl },
          { label: "Nueva Sucursal" },
        ]}
      />

      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-4 sm:p-6 lg:p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Icon Badge Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF5EE] border border-[#DECDBB]/60">
            <div className="h-14 w-14 bg-[#FAF0E6] text-[#D97706] rounded-2xl flex items-center justify-center shrink-0 border border-[#E8DCCB]">
              <MapPin className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B170F]">
                {name || "Nombre de la sucursal"}
              </p>
              <p className="text-xs text-[#8C522B] font-mono mt-0.5">
                /{slug || "slug-automatico"}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Nombre de la Sucursal *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Sucursal Central"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Slug URL (identificador único) *
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true)
                setSlug(e.target.value)
              }}
              placeholder="ej: sucursal-central"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] font-mono placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
            <p className="mt-1 text-xs text-[#8C522B]/80">
              Identificador único para la URL. Se genera automáticamente a partir del nombre.
            </p>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Dirección Física Completa *
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: 4ta Avenida 12-34, Zona 1"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Teléfono de Contacto (Opcional)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +502 5555 1234"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>
        </div>

        {/* ── Barra Fija de Acciones Inferior ── */}
        <AdminStickyFooter
          primaryLabel="Crear Sucursal"
          isPrimarySubmitting={isLoading}
          secondaryLabel="Cancelar"
          secondaryHref={returnUrl}
        />
      </form>
    </div>
  )
}

export default function NuevaSucursalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
        </div>
      }
    >
      <NuevaSucursalContent />
    </Suspense>
  )
}
