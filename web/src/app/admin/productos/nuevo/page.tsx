"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Upload, X, Loader2, Save, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { adminService, categoriesService, ApiClientError } from "@/lib/api"

interface Category {
  id: number
  name: string
  slug: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, "") // Eliminar caracteres especiales
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/-+/g, "-") // Múltiples guiones a uno
    .trim()
}

export default function NuevoProductoPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isNew, setIsNew] = useState(true)
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  // Generar slug automáticamente al escribir el nombre (si no se ha editado manualmente)
  useEffect(() => {
    if (name && !slugManuallyEdited) {
      setSlug(generateSlug(name))
    }
  }, [name, slugManuallyEdited])

  const handleNameChange = (value: string) => {
    setName(value)
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setSlug(value)
  }

  const loadCategories = async () => {
    try {
      const data = await categoriesService.list()
      setCategories(data)
      if (data.length > 0) {
        setCategoryId(data[0].id.toString())
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes")
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5MB")
      return
    }

    // Mostrar preview local
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Subir imagen a Appwrite
    setIsUploading(true)
    setError("")

    try {
      const response = await adminService.uploadImage(file)
      setImageUrl(response.url)
      setUploadedFileId(response.fileId)
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Error al subir la imagen")
      setImagePreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = async () => {
    if (uploadedFileId) {
      try {
        await adminService.deleteImage(uploadedFileId)
      } catch (err) {
        console.error("Error deleting image:", err)
      }
    }
    setImageUrl("")
    setImagePreview(null)
    setUploadedFileId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!name.trim()) {
      setError("El nombre es requerido")
      return
    }
    if (!slug.trim()) {
      setError("El slug es requerido")
      return
    }
    if (!price || parseFloat(price) <= 0) {
      setError("El precio debe ser mayor a 0")
      return
    }
    if (!categoryId) {
      setError("Selecciona una categoría")
      return
    }

    setIsLoading(true)

    try {
      // Encontrar el slug de la categoría seleccionada
      const selectedCategory = categories.find(c => c.id.toString() === categoryId)
      
      await adminService.createProduct({
        sku: `SKU-${slug.trim().toUpperCase()}`,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        categorySlug: selectedCategory?.slug || '',
        isNew,
        imageUrl: imageUrl || undefined,
      })

      showToast(`Producto "${name.trim()}" creado correctamente`, "success")
      router.push("/admin/productos")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Error al crear el producto")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/productos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="text-gray-500">Completa la información del producto</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del producto
            </label>
            <div className="flex items-start gap-4">
              <div 
                className={`relative h-40 w-40 border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                  imagePreview ? "border-amber-300 bg-amber-50" : "border-gray-200 hover:border-amber-400"
                }`}
              >
                {imagePreview ? (
                  <>
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-full w-full flex flex-col items-center justify-center text-gray-400 hover:text-amber-600 transition-colors"
                  >
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Subir imagen</span>
                  </button>
                )}
              </div>
              <div className="flex-1 text-sm text-gray-500">
                <p>Formatos: JPG, PNG, WebP</p>
                <p>Tamaño máximo: 5MB</p>
                <p>Recomendado: 800x800 px</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del producto *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Pan Francés"
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
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="ej: pan-frances"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se genera automáticamente del nombre. Debe ser único.
            </p>
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
              placeholder="Descripción del producto..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Precio *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q</span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Is New */}
          <div className="flex items-center gap-3">
            <input
              id="isNew"
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="isNew" className="text-sm font-medium text-gray-700">
              Marcar como producto nuevo
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/admin/productos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-amber-600 hover:bg-amber-700"
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Producto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
