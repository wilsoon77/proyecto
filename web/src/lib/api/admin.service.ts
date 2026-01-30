import { api } from "./client"
import type { ApiProduct } from "./types"

export interface CreateProductData {
  sku?: string
  name: string
  slug: string
  description?: string
  price: number
  categorySlug: string
  isNew?: boolean
  origin?: 'PRODUCIDO' | 'COMPRADO'
  imageUrl?: string
}

export interface UpdateProductData {
  sku?: string
  name?: string
  slug?: string
  description?: string
  price?: number
  categorySlug?: string
  isNew?: boolean
  isActive?: boolean
  isAvailable?: boolean
  origin?: 'PRODUCIDO' | 'COMPRADO'
  imageUrl?: string
}

// Respuesta detallada del producto por ID
export interface ProductDetailResponse {
  id: number
  sku: string
  name: string
  slug: string
  description?: string
  price: number
  category: string
  categorySlug: string
  categoryId: number
  origin: string
  isNew: boolean
  isActive: boolean
  isAvailable: boolean
  discountPct?: number
  images: Array<{ id: number; url: string; position: number }>
  available: number
  createdAt: string
  updatedAt: string
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

  // Dashboard stats
  getDashboardStats: (): Promise<{
    totalProducts: number
    totalOrders: number
    totalUsers: number
    totalRevenue: number
    pendingOrders: number
    lowStockProducts: number
  }> => api.get("/dashboard/stats"),

  // Categories
  getCategories: (): Promise<Array<{ id: number; name: string; slug: string }>> => 
    api.get("/categories"),
}
