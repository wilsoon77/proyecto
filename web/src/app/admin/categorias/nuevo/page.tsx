"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tag } from "lucide-react"
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

export default function NuevaCategoriaPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
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
      router.push("/admin/categorias")
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-24">
      {/* Header Estandarizado */}
      <AdminPageHeader
        title="Nueva Categoría"
        description="Crea una categoría para clasificar panes, pasteles y postres en el catálogo"
        breadcrumbs={[
          { label: "Categorías", href: "/admin/categorias" },
          { label: "Nueva Categoría" },
        ]}
      />

      {/* Formulario */}
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
              placeholder="Ej: Panes Dulces, Galletas, Repostería Fina"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="slug" className="text-xs font-bold text-[#2B170F] uppercase tracking-wider">
                Slug (URL limpia) *
              </label>
              {slugManuallyEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(false)
                    setSlug(generateSlug(name))
                  }}
                  className="text-xs text-[#D97706] hover:underline font-medium"
                >
                  Regenerar desde nombre
                </button>
              )}
            </div>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="ej: panes-dulces"
              className="w-full px-4 py-2.5 text-sm bg-[#FAF5EE]/50 border border-[#DECDBB] rounded-xl text-[#2B170F] font-mono placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
            <p className="text-[11px] text-[#8C522B] mt-1.5">
              Se mostrará en la tienda web como enlace de filtro directo.
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
          secondaryHref="/admin/categorias"
        />
      </form>
    </div>
  )
}
