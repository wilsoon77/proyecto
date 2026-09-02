"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { systemConfigService } from '@/lib/api'
import { CURRENCY, ORDER_CONFIG, LOCALE } from '@/lib/constants'

interface SystemConfigContextType {
  config: Record<string, any>
  isLoading: boolean
  /** Whether the public catalog can add items and create reservations. */
  canPurchase: boolean
  /** Effective catalog-only mode, including when orders are paused globally. */
  isCatalogOnly: boolean
  refresh: () => Promise<void>
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined)

const DEFAULT_PUBLIC_CONFIG: Record<string, any> = {
  'store.name': 'Panadería Svetlana',
  'store.description': 'Pan tradicional guatemalteco y pan dulce recién horneado.',
  'store.currency': CURRENCY.code,
  'store.currency_symbol': CURRENCY.symbol,
  'store.timezone': LOCALE.timezone,
  'store.operating_hours': '06:00 - 20:00',
  'orders.min_amount': ORDER_CONFIG.minOrderAmount,
  'orders.max_items': 50,
  'orders.accept_orders': true,
  'orders.catalog_only': false,
  'operations.maintenance_mode': false,
}

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Record<string, any>>(DEFAULT_PUBLIC_CONFIG)
  const [isLoading, setIsLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await systemConfigService.getPublic()
      setConfig({ ...DEFAULT_PUBLIC_CONFIG, ...data })
    } catch (error) {
      console.error('Failed to load system config:', error)
      // Fallback a constantes locales
      setConfig(DEFAULT_PUBLIC_CONFIG)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const acceptsOrders = config['orders.accept_orders'] !== false && config['orders.accept_orders'] !== 'false'
  const isCatalogOnly = !acceptsOrders || config['orders.catalog_only'] === true || config['orders.catalog_only'] === 'true'
  const canPurchase = !isLoading && !isCatalogOnly

  return (
    <SystemConfigContext.Provider value={{ config, isLoading, canPurchase, isCatalogOnly, refresh: loadConfig }}>
      {children}
    </SystemConfigContext.Provider>
  )
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext)
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider')
  }
  return context
}
