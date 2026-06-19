"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { systemConfigService } from '@/lib/api'
import { CURRENCY, ORDER_CONFIG, LOCALE } from '@/lib/constants'

interface SystemConfigContextType {
  config: Record<string, any>
  isLoading: boolean
  refresh: () => Promise<void>
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined)

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await systemConfigService.getPublic()
      setConfig(data)
    } catch (error) {
      console.error('Failed to load system config:', error)
      // Fallback a constantes locales
      setConfig({
        'store.name': 'Panadería Svetlana',
        'store.description': 'Los mejores panes de masa madre y repostería artesanal.',
        'store.currency': CURRENCY.code,
        'store.currency_symbol': CURRENCY.symbol,
        'store.timezone': LOCALE.timezone,
        'store.operating_hours': '06:00 - 20:00',
        'orders.min_amount': ORDER_CONFIG.minOrderAmount,
        'orders.max_items': 50,
        'orders.accept_orders': true,
        'operations.maintenance_mode': false,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <SystemConfigContext.Provider value={{ config, isLoading, refresh: loadConfig }}>
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
