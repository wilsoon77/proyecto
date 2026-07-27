import api from './client'

export interface AnalyticsFilters {
  branchId?: number
  productId?: number
  from?: string
  to?: string
  granularity?: 'day' | 'week' | 'month'
  metric?: 'sales' | 'orders' | 'production' | 'waste' | 'stock' | 'forecast'
  level?: 'branch' | 'day' | 'product' | 'source'
  page?: number
  pageSize?: number
}

export interface AnalyticsSeriesPoint {
  date: string
  demandQty: number
  orderQty: number
  dailyCloseQty: number
  productionQty: number
  wasteQty: number
  revenue: number
  orderCount: number
}

export interface AnalyticsOverview {
  range: { from: string; to: string; granularity: string }
  timezone: string
  kpis: {
    revenue: number
    orderCount: number
    averageOrderValue: number
    totalDemandQty: number
    productionQty: number
    wasteQty: number
    lowStockAlerts: number
  }
  dataQuality: {
    totalDays: number
    daysWithData: number
    coverage: number
    sources: { orders: number; dailyCloseResidual: number }
  }
  series: AnalyticsSeriesPoint[]
  topProducts: Array<{
    productId: number
    name: string
    totalDemand: number
    orderQty: number
    dailyCloseQty: number
  }>
  salesByBranch: Array<{
    branchId: number
    branchName: string
    demandQty: number
    revenue: number
    orderCount: number
  }>
  lowStockProducts: Array<{
    productId: number
    productName: string
    branchId: number
    branchName: string
    available: number
  }>
  lastSyncedAt: string | null
}

export interface DrilldownRow {
  key?: string
  branchId?: number | null
  branchName?: string | null
  productId?: number | null
  productName?: string | null
  date?: string | null
  businessDate?: string
  demandQty?: number
  orderQty?: number
  dailyCloseQty?: number
  productionQty?: number
  wasteQty?: number
  quantity?: number
  source?: string
  sourceId?: number
  reference?: string
  href?: string
  amount?: number | null
}

export interface DrilldownResponse {
  level: string
  metric: string
  range: { from: string; to: string }
  data: DrilldownRow[]
  meta: { total: number; page: number; pageSize: number; pageCount?: number }
}

export interface ForecastItem {
  id: number
  productId: number
  forecastDate: string
  predictedQty: number
  lowerBound: number
  upperBound: number
  confidence: number
  recommendedProductionQty: number
  recommendedTrays: number | null
  rawMaterialRisk?: {
    status: 'OK' | 'RISK' | 'NO_RECIPE'
    batches?: number
    materials: Array<{ rawMaterialId: number; name: string; unit: string; required: number; available: number; shortage: number }>
  } | null
  product: { id: number; name: string; slug: string; unitsPerTray: number | null }
}

export interface ForecastRun {
  id: number
  branchId: number
  generatedAt: string
  periodStart: string
  periodEnd: string
  horizonDays: number
  modelVersion: string
  status: string
  errorMessage?: string | null
  branch: { id: number; name: string }
  items: ForecastItem[]
}

function queryString(filters: object) {
  const params = new URLSearchParams()
  Object.entries(filters as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const analyticsService = {
  overview(filters: AnalyticsFilters = {}) {
    return api.get<AnalyticsOverview>(`/analytics/overview${queryString(filters)}`)
  },

  drilldown(filters: AnalyticsFilters = {}) {
    return api.get<DrilldownResponse>(`/analytics/drilldown${queryString(filters)}`)
  },

  productDemand(productId: number, filters: Omit<AnalyticsFilters, 'productId'> = {}) {
    return api.get<DrilldownResponse>(`/analytics/products/${productId}/demand${queryString(filters)}`)
  },

  sync(from: string, to: string, branchId?: number) {
    return api.post(`/analytics/sync${queryString({ from, to, branchId })}`)
  },
}

export const forecastService = {
  latest(branchId?: number) {
    return api.get<ForecastRun | ForecastRun[] | null>(`/predictions${queryString({ branchId })}`)
  },

  getRun(runId: number) {
    return api.get<ForecastRun>(`/predictions/${runId}`)
  },

  run(branchId?: number, horizonDays = 7) {
    return api.post<ForecastRun | ForecastRun[] | null>(`/predictions/run${queryString({ branchId, horizonDays })}`)
  },

  backtest(branchId?: number, days = 14) {
    return api.get(`/predictions/backtest${queryString({ branchId, days })}`)
  },
}

export default analyticsService
