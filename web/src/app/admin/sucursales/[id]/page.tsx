"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Loader as Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { branchesService, ApiClientError } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminStickyFooter } from "@/components/admin/AdminStickyFooter"

export default function EditarSucursalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const branchId = parseInt(resolvedParams.id, 10)
  const router = useRouter()
  const { showToast } = useToast()
  
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

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

  useEffect(() => {
    const loadBranch = async () => {
      try {
        const branch = await branchesService.getById(branchId)
        setName(branch.name)
        setSlug(branch.slug)
        setAddress(branch.address)
        setPhone(branch.phone || "")
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message)
        } else {
          setError("Error al cargar la sucursal")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (!isNaN(branchId)) {
      loadBranch()
    } else {
      setError("ID de sucursal inválido")
      setIsLoading(false)
    }
  }, [branchId])

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

    setIsSaving(true)

    try {
      await branchesService.update(branchId, {
        name: name.trim(),
        slug: slug.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
      })
      showToast(`Sucursal "${name.trim()}" actualizada correctamente`, "success")
      router.push("/admin/sucursales")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al actualizar la sucursal")
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D97706] mx-auto" />
          <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando sucursal...</p>
        </div>
      </div>
    )
  }

  if (error && !name) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
        <Link href="/admin/sucursales" className="mt-4 inline-block">
          <Button variant="outline" className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a sucursales
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-24">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title={`Editar: ${name}`}
        description="Modifica la información general, dirección y teléfono de la sucursal"
        breadcrumbs={[
          { label: "Sucursales", href: "/admin/sucursales" },
          { label: `Editar #${branchId}` },
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
              <MapPin className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B170F]">{name}</p>
              <p className="text-xs text-[#8C522B] font-mono mt-0.5">/{slug}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Nombre de la sucursal *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sucursal Centro"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="slug" className="text-xs font-bold text-[#2B170F] uppercase tracking-wider">
                Slug (URL) *
              </label>
              <button
                type="button"
                onClick={() => setSlug(generateSlug(name))}
                className="text-xs text-[#D97706] hover:underline font-medium"
              >
                Regenerar desde nombre
              </button>
            </div>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: sucursal-centro"
              className="w-full px-4 py-2.5 text-sm bg-[#FAF5EE]/50 border border-[#DECDBB] rounded-xl text-[#2B170F] font-mono placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
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
              placeholder="Ej: Av. Principal #123, Centro"
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
              placeholder="Ej: +502 1234 5678"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>
        </div>

        {/* ── Barra Fija de Acciones Inferior ── */}
        <AdminStickyFooter
          primaryLabel="Guardar Cambios"
          isPrimarySubmitting={isSaving}
          secondaryLabel="Cancelar"
          secondaryHref="/admin/sucursales"
        />
      </form>
    </div>
  )
}
