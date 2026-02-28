"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { categoriesService, ApiClientError } from "@/lib/api"

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
      setError("El nombre es requerido")
      return
    }
    if (!slug.trim()) {
      setError("El slug es requerido")
      return
    }

    setIsSaving(true)

    try {
      await categoriesService.update(originalSlug, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      })
      showToast(`Categoría "${name.trim()}" actualizada correctamente`, "success")
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (error && !name) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link href="/admin/categorias" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/categorias">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Editar Categoría</h1>
          <p className="text-gray-500">Modifica los datos de la categoría</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Icon Preview */}
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Tag className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Panes Dulces"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
              <button
                type="button"
                onClick={() => setSlug(generateSlug(name))}
                className="ml-2 text-xs text-amber-600 hover:text-amber-700"
              >
                Regenerar desde nombre
              </button>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: panes-dulces"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se usa en la URL: /productos?categoria={slug || "slug"}
            </p>
            {slug !== originalSlug && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Cambiar el slug puede romper enlaces existentes
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la categoría..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
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
            <Link href="/admin/categorias">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
