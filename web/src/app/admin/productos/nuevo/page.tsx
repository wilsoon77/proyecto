"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Upload, X, Loader as Loader2, Save, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductPresentationsEditor } from "@/components/admin/ProductPresentationsEditor"
import type { ApiProductPresentationInput } from "@/lib/api/types"
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

function parseExpirationAlertDays(value: string): number[] {
  const days = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 3650)
  const normalized = [...new Set(days)].sort((a, b) => b - a)
  return normalized.length > 0 ? normalized : [3]
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
  const [isActive, setIsActive] = useState(true)
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [comboQuantity, setComboQuantity] = useState("")
  const [comboPrice, setComboPrice] = useState("")
  const [unitsPerTray, setUnitsPerTray] = useState("")
  const [origin, setOrigin] = useState<'PRODUCIDO' | 'COMPRADO'>('PRODUCIDO')
  const [tracksExpiration, setTracksExpiration] = useState(false)
  const [expirationAlertDays, setExpirationAlertDays] = useState("3")
  const [initialExpirationDate, setInitialExpirationDate] = useState("")
  const [presentations, setPresentations] = useState<ApiProductPresentationInput[]>([])

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
    if (origin === 'COMPRADO' && tracksExpiration && !initialExpirationDate) {
      setError("Indica la fecha de vencimiento del primer lote")
      return
    }

    setIsLoading(true)

    try {
      // Encontrar el slug de la categoría seleccionada
      const selectedCategory = categories.find(c => c.id.toString() === categoryId)
      
      const createdProduct = await adminService.createProduct({
        sku: `SKU-${slug.trim().toUpperCase()}`,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        basePrice: parseFloat(price),
        comboQuantity: comboQuantity ? parseInt(comboQuantity, 10) : undefined,
        comboPrice: comboPrice ? parseFloat(comboPrice) : undefined,
        unitsPerTray: origin === 'PRODUCIDO' && unitsPerTray ? parseInt(unitsPerTray, 10) : undefined,
        categorySlug: selectedCategory?.slug || '',
        isNew,
        isActive,
        origin,
        tracksExpiration: origin === 'COMPRADO' && tracksExpiration,
        expirationAlertDays: origin === 'COMPRADO' ? parseExpirationAlertDays(expirationAlertDays) : [],
        presentations: presentations.length > 0 ? presentations : undefined,
        imageUrl: imageUrl || undefined,
      })

      if (origin === 'COMPRADO' && tracksExpiration && initialExpirationDate) {
        const params = new URLSearchParams({
          producto: createdProduct.slug,
          tipo: 'COMPRA',
          caducidad: initialExpirationDate,
        })
        showToast(`Producto "${name.trim()}" creado. Registra ahora su stock inicial.`, "success")
        router.push(`/admin/inventario/movimiento?${params.toString()}`)
        return
      }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Nuevo Producto</h1>
          <p className="text-muted-foreground">Completa la información del producto</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Imagen del producto
            </label>
            <div className="flex items-start gap-4">
              <div 
                className={`relative h-40 w-40 border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                  imagePreview ? "border-primary/30 bg-accent" : "border-border hover:border-primary/40"
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
                        className="absolute top-2 right-2 bg-destructive/100 text-white rounded-full p-1 hover:bg-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors"
                  >
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Subir imagen</span>
                  </button>
                )}
              </div>
              <div className="flex-1 text-sm text-muted-foreground">
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
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Nombre del producto *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Pan Francés"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-2">
              Slug (URL) *
              {slugManuallyEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(false)
                    setSlug(generateSlug(name))
                  }}
                  className="ml-2 text-xs text-primary hover:text-primary"
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
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se genera automáticamente del nombre. Debe ser único.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del producto..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
                Precio *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Categoría *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
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
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="isNew" className="text-sm font-medium text-foreground">
              Marcar como producto nuevo
            </label>
          </div>

          {/* Visibilidad en e-commerce */}
          <div className="bg-cream rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Visibilidad en e-commerce</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Mostrar este producto en el catálogo</span>
                <span className="block text-xs text-muted-foreground">Ocultarlo solo lo quita del e-commerce; seguirá disponible para inventario y cierre diario.</span>
              </span>
            </label>
          </div>

          {/* Origen y caducidad */}
          <div className="bg-cream rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cómo se abastece</h3>
              <p className="text-xs text-muted-foreground mt-1">Define si el producto se hornea o se compra a un proveedor.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer rounded-lg border p-3 ${origin === 'PRODUCIDO' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input type="radio" name="origin" value="PRODUCIDO" checked={origin === 'PRODUCIDO'} onChange={() => { setOrigin('PRODUCIDO'); setTracksExpiration(false); setInitialExpirationDate("") }} className="mr-2" />
                <span className="text-sm font-medium">Producido</span>
                <span className="block text-xs text-muted-foreground mt-1">Usa receta y materia prima.</span>
              </label>
              <label className={`cursor-pointer rounded-lg border p-3 ${origin === 'COMPRADO' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input type="radio" name="origin" value="COMPRADO" checked={origin === 'COMPRADO'} onChange={() => { setOrigin('COMPRADO'); setUnitsPerTray('') }} className="mr-2" />
                <span className="text-sm font-medium">Comprado</span>
                <span className="block text-xs text-muted-foreground mt-1">Se ingresa desde un proveedor.</span>
              </label>
            </div>
            {origin === 'COMPRADO' && (
              <div className="border-t border-border pt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={tracksExpiration} onChange={(e) => { const checked = e.target.checked; setTracksExpiration(checked); if (!checked) setInitialExpirationDate("") }} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Controlar fecha de caducidad</span>
                    <span className="block text-xs text-muted-foreground">El sistema avisará antes de que se venza el lote.</span>
                  </span>
                </label>
                {tracksExpiration && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha de vencimiento del primer lote *</label>
                      <input
                        type="date"
                        value={initialExpirationDate}
                        onChange={(e) => setInitialExpirationDate(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">Se precargará al registrar el stock inicial.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Días de anticipación para avisos</label>
                      <input type="text" inputMode="numeric" value={expirationAlertDays} onChange={(e) => setExpirationAlertDays(e.target.value)} placeholder="30, 15, 3" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                      <p className="text-xs text-muted-foreground mt-1">Opcionalmente agrega varios separados por comas. Ejemplo: 30, 15 y 3 días antes.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <ProductPresentationsEditor value={presentations} onChange={setPresentations} />

          {/* Combo Pricing */}
          <div className="bg-accent rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-primary">Precio por Volumen (Combo)</h3>
            <p className="text-xs text-primary">Opcional. Ej: "3 por Q1.25"</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Cantidad combo</label>
                <input
                  type="number"
                  min="0"
                  value={comboQuantity}
                  onChange={(e) => setComboQuantity(e.target.value)}
                  placeholder="Ej: 3"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Precio combo (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={comboPrice}
                  onChange={(e) => setComboPrice(e.target.value)}
                  placeholder="Ej: 1.25"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {origin === 'PRODUCIDO' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Unidades/Lata</label>
                  <input
                    type="number"
                    min="0"
                    value={unitsPerTray}
                    onChange={(e) => setUnitsPerTray(e.target.value)}
                    placeholder="Ej: 36"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
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
            className="bg-primary hover:bg-primary/90"
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
