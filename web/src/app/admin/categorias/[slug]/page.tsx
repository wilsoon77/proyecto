"use client"

import { useState, useEffect, use, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Tag, Loader as Loader2 } from "lucide-react"
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

function EditarCategoriaContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
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
      router.push(returnUrl)
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
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
        <Link href={returnUrl} className="mt-4 inline-block">
          <Button variant="outline" className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a categorías
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header Estandarizado */}
      <AdminPageHeader
        title={`Editar: ${name}`}
        description="Modifica la información y ruta de navegación de esta categoría"
        breadcrumbs={[
          { label: "Categorías", href: returnUrl },
          { label: `Editar ${name}` },
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
              onChange={(e) => {
                setName(e.target.value)
              }}
              placeholder="Ej: Panadería Artesanal"
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
                onChange={(e) => setSlug(e.target.value)}
                placeholder="panaderia-artesanal"
                className="w-full py-2.5 px-1 text-sm bg-transparent font-mono text-[#2B170F] focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#6E5545] mt-1.5">
              Identificador único usado en las direcciones web del catálogo.
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
          secondaryHref={returnUrl}
        />
      </form>
    </div>
  )
}

export default function EditarCategoriaPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
        </div>
      }
    >
      <EditarCategoriaContent {...props} />
    </Suspense>
  )
}
