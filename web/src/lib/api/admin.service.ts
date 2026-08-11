import { api } from "./client"
import type { ApiProduct, ApiProductPresentation } from "./types"

export interface CreateProductData {
  sku?: string
  name: string
  slug: string
  description?: string
  basePrice: number
  comboQuantity?: number
  comboPrice?: number
  unitsPerTray?: number
  categorySlug: string
  isNew?: boolean
  isActive?: boolean
  origin?: 'PRODUCIDO' | 'COMPRADO'
  tracksExpiration?: boolean
  expirationAlertDays?: number
  stockUnitLabel?: string
  presentations?: Array<Partial<ApiProductPresentation> & { name: string; unitsInStock: number }>
  imageUrl?: string
}

export interface UpdateProductData {
  sku?: string
  name?: string
  slug?: string
  description?: string
  basePrice?: number
  comboQuantity?: number
  comboPrice?: number
  unitsPerTray?: number
  categorySlug?: string
  isNew?: boolean
  isActive?: boolean
  isAvailable?: boolean
  origin?: 'PRODUCIDO' | 'COMPRADO'
  tracksExpiration?: boolean
  expirationAlertDays?: number
  stockUnitLabel?: string
  presentations?: Array<Partial<ApiProductPresentation> & { name: string; unitsInStock: number }>
  imageUrl?: string
}

// Respuesta detallada del producto por ID
export interface ProductDetailResponse {
  id: number
  sku: string
  name: string
  slug: string
  description?: string
  basePrice: number
  category: string
  categorySlug: string
  categoryId: number
  origin: string
  tracksExpiration: boolean
  expirationAlertDays: number
  isNew: boolean
  isActive: boolean
  isAvailable: boolean
  comboQuantity?: number
  comboPrice?: number
  unitsPerTray?: number
  images: Array<{ id: number; url: string; position: number }>
  available: number
  createdAt: string
  updatedAt: string
  stockUnitLabel?: string
  presentations?: ApiProductPresentation[]
}

export interface UploadImageResponse {
  fileId: string
  url: string
  previewUrl: string
}

export const adminService = {
  // Products CRUD - usando ID (mejor práctica)
  getProductById: (id: number): Promise<ProductDetailResponse> => 
    api.get(`/products/by-id/${id}`),
  
  createProduct: (data: CreateProductData): Promise<ApiProduct> => 
    api.post("/products", data),
  
  updateProduct: (id: number, data: UpdateProductData): Promise<ApiProduct> => 
    api.patch(`/products/by-id/${id}`, data),
  
  deactivateProduct: (id: number): Promise<ApiProduct> => 
    api.post(`/products/by-id/${id}/deactivate`),
  
  deleteProduct: (id: number): Promise<{ deleted: boolean; id: number }> => 
    api.delete(`/products/by-id/${id}`),

  // Image upload
  uploadImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    
    const response = await api.uploadFile<UploadImageResponse>("/storage/upload", formData)
    return response
  },

  deleteImage: (fileId: string): Promise<void> => 
    api.delete(`/storage/${fileId}`),

  // Categories
  getCategories: (): Promise<Array<{ id: number; name: string; slug: string }>> => 
    api.get("/categories"),
}
