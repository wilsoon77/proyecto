"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Tag, Loader as Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export default function EditarCategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { showToast } = useToast()
  
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [originalSlug, setOriginalSlug] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const category = await categoriesService.getBySlug(resolvedParams.slug)
        setName(category.name)
        setSlug(category.slug)
        setOriginalSlug(category.slug)
        setDescription(category.description || "")
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message)
        } else {
          setError("Error al cargar la categoría")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCategory()
  }, [resolvedParams.slug])

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

    setIsSaving(true)

    try {
      await categoriesService.update(originalSlug, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      })
      showToast(`Categoría "${name.trim()}" actualizada con éxito`, "success")
      router.push("/admin/categorias")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al actualizar la categoría")
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
          <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando categoría...</p>
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
        <Link href="/admin/categorias" className="mt-4 inline-block">
          <Button variant="outline" className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a categorías
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-24">
      {/* Header Estandarizado */}
      <AdminPageHeader
        title={`Editar: ${name}`}
        description="Modifica la información y ruta de navegación de esta categoría"
        breadcrumbs={[
          { label: "Categorías", href: "/admin/categorias" },
          { label: `Editar ${name}` },
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

          {/* Icon Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF5EE] border border-[#DECDBB]/60">
            <div className="h-14 w-14 bg-[#FAF0E6] text-[#D97706] rounded-2xl flex items-center justify-center shrink-0 border border-[#E8DCCB]">
              <Tag className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2B170F]">{name}</p>
              <p className="text-xs text-[#8C522B] font-mono mt-0.5">/{slug}</p>
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Panes Dulces"
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="slug" className="text-xs font-bold text-[#2B170F] uppercase tracking-wider">
                Slug (URL limpia) *
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
              placeholder="ej: panes-dulces"
              className="w-full px-4 py-2.5 text-sm bg-[#FAF5EE]/50 border border-[#DECDBB] rounded-xl text-[#2B170F] font-mono placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
            {slug !== originalSlug && (
              <p className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Cambiar el slug puede afectar enlaces guardados previamente.</span>
              </p>
            )}
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
              placeholder="Descripción de la categoría..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] resize-none"
            />
          </div>
        </div>

        {/* Barra Fija Inferior */}
        <AdminStickyFooter
          primaryLabel="Guardar Cambios"
          isPrimarySubmitting={isSaving}
          secondaryLabel="Cancelar"
          secondaryHref="/admin/categorias"
        />
      </form>
    </div>
  )
}
