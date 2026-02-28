"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { branchesService, ApiClientError } from "@/lib/api"

export default function NuevaSucursalPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [slug, setSlug] = useState("")
  const [phone, setPhone] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      setError("El nombre es requerido")
      return
    }
    if (!address.trim()) {
      setError("La dirección es requerida")
      return
    }
    if (!slug.trim()) {
      setError("El slug es requerido")
      return
    }

    setIsLoading(true)

    try {
      await branchesService.create({
        name: name.trim(),
        slug: slug.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
      })
      showToast(`Sucursal "${name.trim()}" creada correctamente`, "success")
      router.push("/admin/sucursales")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al crear la sucursal")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/sucursales">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Nueva Sucursal</h1>
          <p className="text-gray-500">Registra una nueva ubicación</p>
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
              <MapPin className="h-10 w-10 text-amber-600" />
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
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Sucursal Centro"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
              {slugManuallyEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(false)
                    setSlug(generateSlug(name))
                  }}
                  className="ml-2 text-xs text-amber-600 hover:text-amber-700"
                >
                  Regenerar
                </button>
              )}
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true)
                setSlug(e.target.value)
              }}
              placeholder="ej: sucursal-centro"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Principal #123, Centro"
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
              placeholder="Ej: +52 123 456 7890"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Sucursal
                </>
              )}
            </Button>
            <Link href="/admin/sucursales">
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
