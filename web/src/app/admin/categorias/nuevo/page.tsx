"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tag, Loader as Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { categoriesService, ApiClientError } from "@/lib/api"
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

function NuevaCategoriaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const returnUrlParam = searchParams.get("returnUrl")
  const [returnUrl, setReturnUrl] = useState<string>("/admin/categorias")

  useEffect(() => {
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam)
    } else {
      try {
        const saved = sessionStorage.getItem("admin_categorias_return_url")
        if (saved) setReturnUrl(saved)
      } catch {}
    }
  }, [returnUrlParam])
  
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setSlug(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("El nombre de la categoría es requerido")
      return
    }
    if (!slug.trim()) {
      setError("El slug URL es requerido")
      return
    }

    setIsLoading(true)

    try {
      await categoriesService.create({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      })
      showToast(`Categoría "${name.trim()}" creada con éxito`, "success")
      router.push(returnUrl)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al crear la categoría. Verifica que el slug no esté repetido.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header Estandarizado */}
      <AdminPageHeader
        title="Nueva Categoría"
        description="Crea una categoría para clasificar panes, pasteles y postres en el catálogo"
        breadcrumbs={[
          { label: "Categorías", href: returnUrl },
          { label: "Nueva Categoría" },
        ]}
      />

      {/* Formulario */}
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
              <Tag className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B170F]">
                {name || "Nombre de la categoría"}
              </p>
              <p className="text-xs text-[#8C522B] font-mono mt-0.5">
                /{slug || "slug-automatico"}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Nombre de la categoría *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Repostería Fina"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Slug URL (identificador único) *
            </label>
            <div className="flex items-center rounded-xl border border-[#DECDBB] bg-[#FAF5EE] px-3 focus-within:ring-2 focus-within:ring-[#D97706]/30 focus-within:border-[#D97706]">
              <span className="text-xs text-[#8C522B] font-mono">/categorias/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="reposteria-fina"
                className="w-full py-2.5 px-1 text-sm bg-transparent font-mono text-[#2B170F] focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#6E5545] mt-1.5">
              Identificador único usado en las direcciones web del catálogo. Se genera automáticamente.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-bold text-[#2B170F] uppercase tracking-wider mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve detalle sobre los productos agrupados aquí..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] resize-none"
            />
          </div>
        </div>

        {/* Barra Fija Inferior */}
        <AdminStickyFooter
          primaryLabel="Crear Categoría"
          isPrimarySubmitting={isLoading}
          secondaryLabel="Cancelar"
          secondaryHref={returnUrl}
        />
      </form>
    </div>
  )
}

export default function NuevaCategoriaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
        </div>
      }
    >
      <NuevaCategoriaContent />
    </Suspense>
  )
}
