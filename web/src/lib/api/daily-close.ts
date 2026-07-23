import api from './client'

export interface DailyClosePreviewItem {
  productId: number
  productName: string
  sku: string
  isActive: boolean
  systemQty: number
  reservedQty: number
  countedQty: number
  wasteQty: number
  inventoryUpdatedAt: string | null
}

export interface DailyClosePreview {
  branchId: number
  closeDate: string
  snapshotAt: string
  items: DailyClosePreviewItem[]
}

export interface CreateDailyCloseItem {
  productId: number
  countedQty: number
  wasteQty?: number
}

export interface CreateDailyClosePayload {
  branchId?: number
  closeDate: string
  snapshotAt: string
  note?: string
  items: CreateDailyCloseItem[]
}

export interface DailyCloseSummary {
  totalSold: number
  totalWaste: number
  totalSurplus: number
  productsClosed: number
}

export interface DailyCloseItem {
  id?: number
  productId: number
  productName: string
  systemQty: number
  reservedQty: number
  countedQty: number
  wasteQty: number
  soldQty: number
  surplusQty: number
}

export interface DailyCloseRecord {
  id: number
  closeDate: string
  branch: { id: number; name: string; slug: string }
  user: { id: string; firstName: string; lastName: string; email: string }
  note?: string | null
  createdAt: string
  summary: DailyCloseSummary
}

export interface DailyCloseListResponse {
  data: DailyCloseRecord[]
  meta: { total: number; pageCount: number; page: number; pageSize: number }
}

export interface DailyCloseDetail extends DailyCloseRecord {
  branchId: number
  userId: string
  snapshotAt: string
  items: DailyCloseItem[]
  stockMovements: Array<{
    id: number
    productId: number
    type: string
    quantity: number
    referenceId?: string | null
    note?: string | null
    createdAt: string
    product?: { id: number; name: string; slug: string }
  }>
}

export interface DailyCloseListFilters {
  branchId?: number
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

function queryString<T extends object>(filters: T) {
  const params = new URLSearchParams()
  Object.entries(filters as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const dailyCloseService = {
  async preview(branchId: number, closeDate?: string): Promise<DailyClosePreview> {
    return api.get<DailyClosePreview>(
      `/daily-close/preview${queryString({ branchId, closeDate })}`,
    )
  },

  async create(payload: CreateDailyClosePayload): Promise<DailyCloseDetail> {
    return api.post<DailyCloseDetail>('/daily-close', payload)
  },

  async list(filters: DailyCloseListFilters = {}): Promise<DailyCloseListResponse> {
    return api.get<DailyCloseListResponse>(`/daily-close${queryString(filters)}`)
  },

  async getDetail(id: number): Promise<DailyCloseDetail> {
    return api.get<DailyCloseDetail>(`/daily-close/${id}`)
  },
}

export default dailyCloseService
