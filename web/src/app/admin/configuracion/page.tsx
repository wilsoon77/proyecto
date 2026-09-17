"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  Settings,
  Store,
  Bell,
  Shield,
  Palette,
  Mail,
  Clock,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  Building2,
  Package,
  Coins,
  Volume2,
  Play,
  ShoppingCart,
  Flame,
  Search,
  CheckCircle2,
  Info,
  User,
  Settings2,
  Trash2,
  LogOut,
  Activity,
  Bot,
  ExternalLink,
  RefreshCw,
  Cpu,
  Zap,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { useSystemConfig } from "@/context/SystemConfigContext"
import { 
  branchesService, 
  systemConfigService, 
  notificationsService, 
  assistantService,
  type AssistantDiagnostics,
  type TelegramDiagnostics,
  type ProviderTestResult
} from "@/lib/api"
import { useNotifications } from "@/context/NotificationContext"
import type { NotificationConfig } from "@/lib/api/types"

const PLACEHOLDERS_HELP: Record<string, string[]> = {
  'inventory.raw_material_low': ['{materialName}', '{current}', '{unit}', '{branchName}'],
  'inventory.expiration_warning': ['{productName}', '{quantity}', '{expiresAt}', '{daysBefore}', '{branchName}'],
}

interface Branch {
  id: number
  name: string
  slug: string
  address: string
  phone?: string
}

// Configuración local (en futuro se puede conectar a una API de settings)
interface AppSettings {
  // Negocio
  storeName: string
  storeDescription: string
  currency: string
  timezone: string
  // Pedidos
  minOrderAmount: number
  maxOrderItems: number
  // Notificaciones
  emailNotifications: boolean
  orderConfirmationEmail: boolean
  lowStockAlerts: boolean
  lowStockThreshold: number
  // Operación
  acceptOrders: boolean
  catalogOnly: boolean
  maintenanceMode: boolean
  operatingHours: string
  statusPageUrl: string
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "Panadería Artesanal",
  storeDescription: "El mejor pan fresco y tradicional de la ciudad",
  currency: "GTQ",
  timezone: "America/Guatemala",
  minOrderAmount: 15,
  maxOrderItems: 50,
  emailNotifications: true,
  orderConfirmationEmail: true,
  lowStockAlerts: true,
  lowStockThreshold: 10,
  acceptOrders: true,
  catalogOnly: false,
  maintenanceMode: false,
  operatingHours: "Lunes a Sábado: 7:00 AM - 8:00 PM",
  statusPageUrl: "https://uptime.betterstack.com",
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const { refresh: refreshSystemConfig } = useSystemConfig()
  const searchParams = useSearchParams()
  const [branches, setBranches] = useState<Branch[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "pedidos" | "notificaciones" | "sucursales" | "asistente">("general")

  // Estado para pestaña de Asistente & Bot IA
  const [assistantDiagnostics, setAssistantDiagnostics] = useState<AssistantDiagnostics | null>(null)
  const [telegramDiagnostics, setTelegramDiagnostics] = useState<TelegramDiagnostics | null>(null)
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(false)
  const [isTestingProvider, setIsTestingProvider] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, ProviderTestResult | null>>({})
  const [providerModels, setProviderModels] = useState<Record<string, string>>({})
  const [selectedPrimaryProvider, setSelectedPrimaryProvider] = useState<string>("auto")
  const [isSavingAssistant, setIsSavingAssistant] = useState(false)
  const [isSyncingWebhook, setIsSyncingWebhook] = useState(false)

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['general', 'pedidos', 'notificaciones', 'sucursales', 'asistente'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  const { 
    isSubscribed, 
    permissionState, 
    subscribeUser, 
    unsubscribeUser, 
    playNotificationSound 
  } = useNotifications()
  const [notificationConfigs, setNotificationConfigs] = useState<NotificationConfig[]>([])
  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null)
  const [configForm, setConfigForm] = useState<Partial<NotificationConfig>>({})
  const [diagnostics, setDiagnostics] = useState<any>(null)

  const handleStartEditConfig = (cfg: NotificationConfig) => {
    setEditingConfigKey(cfg.key)
    setConfigForm({
      title: cfg.title,
      message: cfg.message,
      targetRoles: [...cfg.targetRoles],
      soundType: cfg.soundType,
      thresholds: cfg.thresholds ? { ...cfg.thresholds } : null
    })
  }

  const handleSaveConfig = async (key: string) => {
    try {
      const updated = await notificationsService.updateConfig(key, {
        title: configForm.title,
        message: configForm.message,
        targetRoles: configForm.targetRoles,
        soundType: configForm.soundType,
        thresholds: configForm.thresholds
      })
      
      setNotificationConfigs(prev => prev.map(c => c.key === key ? updated : c))
      setEditingConfigKey(null)
      showToast("Configuración guardada correctamente", "success")
    } catch (error) {
      console.error("Error saving config:", error)
      showToast("Error al guardar la configuración", "error")
    }
  }

  const handleToggleConfig = async (key: string, isEnabled: boolean) => {
    try {
      const updated = await notificationsService.updateConfig(key, { isEnabled })
      setNotificationConfigs(prev => prev.map(c => c.key === key ? updated : c))
      showToast(isEnabled ? "Notificación activada" : "Notificación desactivada", "success")
    } catch (error) {
      console.error("Error toggling config:", error)
      showToast("Error al actualizar la notificación", "error")
    }
  }

  const handleTestConfig = async (key: string) => {
    try {
      await notificationsService.sendTestNotification(key)
      showToast("Notificación de prueba enviada", "success")
    } catch (error) {
      console.error("Error sending test notification:", error)
      showToast("Error al enviar notificación de prueba", "error")
    }
  }

  // Protección de rol - solo ADMIN puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [currentUser, router])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar sucursales
      const branchesData = await branchesService.list()
      setBranches(branchesData)
      
      // Cargar configuración desde la API
      const dbConfigs = await systemConfigService.list()
      const newSettings = { ...DEFAULT_SETTINGS }
      
      // Mapear cada config clave-valor
      dbConfigs.forEach(cfg => {
        switch (cfg.key) {
          case 'store.name':
            newSettings.storeName = cfg.value
            break
          case 'store.description':
            newSettings.storeDescription = cfg.value
            break
          case 'store.currency':
            newSettings.currency = cfg.value
            break
          case 'store.timezone':
            newSettings.timezone = cfg.value
            break
          case 'store.operating_hours':
            newSettings.operatingHours = cfg.value
            break
          case 'orders.min_amount':
            newSettings.minOrderAmount = Number(cfg.value)
            break
          case 'orders.max_items':
            newSettings.maxOrderItems = Number(cfg.value)
            break
          case 'orders.accept_orders':
            newSettings.acceptOrders = cfg.value === true || cfg.value === 'true'
            break
          case 'orders.catalog_only':
            newSettings.catalogOnly = cfg.value === true || cfg.value === 'true'
            break
          case 'operations.maintenance_mode':
            newSettings.maintenanceMode = cfg.value === true || cfg.value === 'true'
            break
          case 'system.status_page_url':
            if (cfg.value) newSettings.statusPageUrl = cfg.value
            break
        }
      })
      
      setSettings(newSettings)

      // Cargar configs de notificaciones reales y diagnóstico
      try {
        const [configsData, diagData] = await Promise.all([
          notificationsService.getConfigs(),
          notificationsService.getDiagnostics().catch(() => null)
        ])
        setNotificationConfigs(configsData)
        if (diagData) setDiagnostics(diagData)
      } catch (err) {
        console.error("Error loading notification configs or diagnostics:", err)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      showToast("Error al cargar la configuración", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Guardar cada config en la API que no sea read-only
      const updates = [
        systemConfigService.update('store.name', settings.storeName),
        systemConfigService.update('store.description', settings.storeDescription),
        systemConfigService.update('store.operating_hours', settings.operatingHours),
        systemConfigService.update('orders.min_amount', settings.minOrderAmount),
        systemConfigService.update('orders.max_items', settings.maxOrderItems),
        systemConfigService.update('orders.accept_orders', settings.acceptOrders),
        systemConfigService.update('orders.catalog_only', settings.catalogOnly),
        systemConfigService.update('operations.maintenance_mode', settings.maintenanceMode),
        systemConfigService.update('system.status_page_url', settings.statusPageUrl),
      ]
      
      await Promise.all(updates)
      await refreshSystemConfig().catch(console.error)

      showToast("Configuración guardada correctamente", "success")
    } catch (error) {
      console.error("Error saving settings:", error)
      showToast("Error al guardar la configuración", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const loadAssistantData = useCallback(async () => {
    setIsLoadingAssistant(true)
    try {
      const [astDiag, tgDiag] = await Promise.all([
        assistantService.getDiagnostics().catch((e) => {
          console.error("Error al obtener diagnóstico de asistente:", e)
          return null
        }),
        assistantService.getTelegramDiagnostics().catch((e) => {
          console.error("Error al obtener diagnóstico de telegram:", e)
          return null
        }),
      ])
      if (astDiag) {
        setAssistantDiagnostics(astDiag)
        setSelectedPrimaryProvider(astDiag.activeProvider || 'auto')
        const initialModels: Record<string, string> = {}
        astDiag.providers.forEach((p) => {
          initialModels[p.name] = p.activeModel
        })
        setProviderModels(initialModels)
      }
      if (tgDiag) {
        setTelegramDiagnostics(tgDiag)
      }
    } catch (err) {
      console.error("Error cargando datos de asistente:", err)
      showToast("Error al consultar estado de asistentes e IA", "error")
    } finally {
      setIsLoadingAssistant(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'asistente' && !assistantDiagnostics) {
      loadAssistantData()
    }
  }, [activeTab, assistantDiagnostics, loadAssistantData])

  const handleTestProvider = async (providerName: string) => {
    setIsTestingProvider((prev) => ({ ...prev, [providerName]: true }))
    try {
      const currentModel = providerModels[providerName]
      const result = await assistantService.testProvider(providerName, currentModel)
      setTestResults((prev) => ({ ...prev, [providerName]: result }))
      if (result.ok) {
        showToast(`${providerName.toUpperCase()}: Conexión exitosa (${result.latencyMs}ms)`, "success")
      } else {
        showToast(`${providerName.toUpperCase()}: ${result.error || 'Error al conectar'}`, "error")
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al conectar con el proveedor'
      setTestResults((prev) => ({
        ...prev,
        [providerName]: { ok: false, latencyMs: 0, status: 500, model: providerModels[providerName] || '', error: msg }
      }))
      showToast(msg, "error")
    } finally {
      setIsTestingProvider((prev) => ({ ...prev, [providerName]: false }))
    }
  }

  const handleSaveAssistantConfig = async () => {
    setIsSavingAssistant(true)
    try {
      await assistantService.updateConfig({
        provider: selectedPrimaryProvider,
        models: providerModels,
      })
      showToast("Configuración de IA y Asistente guardada exitosamente", "success")
      await loadAssistantData()
    } catch (err: any) {
      showToast(err?.message || "Error al guardar configuración de IA", "error")
    } finally {
      setIsSavingAssistant(false)
    }
  }

  const handleSyncWebhook = async () => {
    setIsSyncingWebhook(true)
    try {
      const res = await assistantService.registerTelegramWebhook()
      showToast(res.description || "Webhook de Telegram registrado correctamente", "success")
      const updatedTg = await assistantService.getTelegramDiagnostics()
      setTelegramDiagnostics(updatedTg)
    } catch (err: any) {
      showToast(err?.message || "Error al sincronizar webhook de Telegram", "error")
    } finally {
      setIsSyncingWebhook(false)
    }
  }

  const tabs = [
    { id: "general", label: "General", icon: Store },
    { id: "pedidos", label: "Pedidos", icon: Package },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "sucursales", label: "Sucursales", icon: Building2 },
    { id: "asistente", label: "Asistente & Bot IA", icon: Bot },
  ] as const

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-border rounded w-48"></div>
          <div className="bg-card rounded-xl h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Configuración
          </h1>
          <p className="text-muted-foreground mt-1">Administra las opciones del sistema</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
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
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile horizontal tabs */}
        <div className="lg:hidden">
          <div className="bg-card rounded-xl shadow-sm border border-border p-1.5">
            <div className="flex overflow-x-auto gap-1 no-scrollbar">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-accent text-primary'
                        : 'text-muted-foreground hover:bg-cream'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar tabs */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <nav className="bg-card rounded-xl shadow-sm border border-border p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent text-primary font-medium'
                      : 'text-muted-foreground hover:bg-cream'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Estado del sistema */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 mt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Estado del Sistema</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedidos</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  settings.acceptOrders && !settings.catalogOnly ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {settings.acceptOrders && !settings.catalogOnly ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {settings.catalogOnly ? 'Solo catálogo' : settings.acceptOrders ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mantenimiento</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  settings.maintenanceMode ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>
                  {settings.maintenanceMode ? 'Activo' : 'Normal'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-sm text-muted-foreground">Monitor Uptime</span>
                {settings.statusPageUrl ? (
                  <a
                    href={settings.statusPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
                  >
                    <span>En línea</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin configurar</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
            
            {/* Tab: General */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Información del Negocio
                  </h2>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nombre de la Tienda
                      </label>
                      <input
                        type="text"
                        value={settings.storeName}
                        onChange={(e) => updateSetting("storeName", e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={settings.storeDescription}
                        onChange={(e) => updateSetting("storeDescription", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Moneda
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => updateSetting("currency", e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                          disabled
                        >
                          <option value="GTQ">GTQ - Quetzal Guatemalteco</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">Solo disponible en Guatemala</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Zona Horaria
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => updateSetting("timezone", e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                          disabled
                        >
                          <option value="America/Guatemala">Guatemala (CST)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Clock className="inline-block h-4 w-4 mr-1" />
                        Horario de Operación
                      </label>
                      <input
                        type="text"
                        value={settings.operatingHours}
                        onChange={(e) => updateSetting("operatingHours", e.target.value)}
                        placeholder="06:00 - 20:00"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          <Activity className="inline-block h-4 w-4 mr-1 text-primary" />
                          URL de Status Page (Better Stack / Uptime)
                        </label>
                        {settings.statusPageUrl && (
                          <a
                            href={settings.statusPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <span>Abrir monitor</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        value={settings.statusPageUrl}
                        onChange={(e) => updateSetting("statusPageUrl", e.target.value)}
                        placeholder="https://uptime.betterstack.com"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-start sm:items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 flex-shrink-0 text-primary mt-0.5 sm:mt-0" />
                        <span>Monitorea en Better Stack usando los endpoints: <code className="bg-cream px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-semibold">/health/live</code> (API), <code className="bg-cream px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-semibold">/health/db</code> (Base de Datos) y la URL del Frontend.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estado de operación */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-md font-semibold text-foreground mb-4">Estado de Operación</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-cream rounded-lg cursor-pointer hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium text-foreground">Aceptar Pedidos</p>
                          <p className="text-sm text-muted-foreground">Permite recibir nuevos pedidos</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.acceptOrders}
                        onChange={(e) => updateSetting("acceptOrders", e.target.checked)}
                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-cream rounded-lg cursor-pointer hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Catálogo solo informativo</p>
                          <p className="text-sm text-muted-foreground">Muestra productos y precios, pero oculta la compra y bloquea nuevas reservas</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.catalogOnly}
                        onChange={(e) => updateSetting("catalogOnly", e.target.checked)}
                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-cream rounded-lg cursor-pointer hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium text-foreground">Modo Mantenimiento</p>
                          <p className="text-sm text-muted-foreground">Solo administradores pueden acceder</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => updateSetting("maintenanceMode", e.target.checked)}
                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Pedidos */}
            {activeTab === "pedidos" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Configuración de Pedidos
                </h2>

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Coins className="inline-block h-4 w-4 mr-1" />
                        Monto Mínimo de Pedido
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">Q</span>
                        <input
                          type="number"
                          min="0"
                          value={settings.minOrderAmount}
                          onChange={(e) => updateSetting("minOrderAmount", Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Máximo de Items por Pedido
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.maxOrderItems}
                        onChange={(e) => updateSetting("maxOrderItems", Number(e.target.value))}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground">
                      El sistema opera con reserva y retiro en sucursal. El pago se realiza al momento de recoger.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notificaciones */}
            {activeTab === "notificaciones" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Configuración de Notificaciones
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Controla las alertas automáticas del sistema, umbrales y roles destinatarios.</p>
                  </div>
                </div>

                {/* Device Push Subscription Management */}
                <div className="bg-gradient-to-r from-accent to-accent/20 rounded-xl p-5 border border-amber-100/55 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                    <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${isSubscribed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60'}`}>
                      <Volume2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Estado de Notificaciones Push</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {isSubscribed 
                          ? 'Recibirás alertas en tiempo real en este dispositivo, incluso con el navegador cerrado.' 
                          : 'Activa las notificaciones para mantenerte al tanto de pedidos, inventarios y alertas de seguridad.'}
                      </p>
                      {permissionState === 'denied' && (
                        <p className="text-xs text-destructive font-medium mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Permiso denegado por el navegador. Por favor restablece los permisos en la barra de direcciones.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full lg:w-auto shrink-0 gap-2 mt-2 lg:mt-0">
                    {isSubscribed ? (
                      <button
                        onClick={unsubscribeUser}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-card text-foreground font-medium rounded-lg border border-border shadow-sm hover:bg-cream text-sm transition-colors whitespace-nowrap"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={subscribeUser}
                        disabled={permissionState === 'denied'}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 shadow-sm text-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Activar Notificaciones
                      </button>
                    )}
                  </div>
                </div>

                {/* Diagnostics Panel */}
                {diagnostics && (
                  <div className="bg-cream rounded-xl p-5 border border-border text-sm">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Diagnóstico de Sistema Push (Backend)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground mb-1">Estado de VAPID (Render):</p>
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${diagnostics.vapidConfigured ? 'bg-success/100' : 'bg-destructive/100'}`}></div>
                          <span className="font-medium text-foreground">
                            {diagnostics.vapidConfigured ? 'Configurado correctamente' : 'Faltan variables de entorno'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Suscripciones activas de tu usuario:</p>
                        <p className="font-medium text-foreground">{diagnostics.activeSubscriptions} dispositivos registrados</p>
                      </div>
                    </div>
                    
                    {!diagnostics.vapidConfigured && (
                      <div className="mt-3 bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/10 text-xs">
                        <strong>Atención:</strong> Las variables VAPID no están configuradas en el servidor. Las notificaciones push no llegarán a los dispositivos hasta que configures VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT en tu servidor.
                      </div>
                    )}
                  </div>
                )}

                {/* Notification Config Cards List */}
                <div className="space-y-4">
                  {notificationConfigs.map((cfg) => {
                    const isEditing = editingConfigKey === cfg.key
                    const hasThreshold = !!cfg.thresholds
                    
                    return (
                      <div 
                        key={cfg.key} 
                        className={`border rounded-xl transition-all duration-200 ${
                          cfg.isEnabled 
                            ? 'bg-card border-border shadow-sm' 
                            : 'bg-cream/50 border-border/60 opacity-80'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-lg border flex items-center justify-center ${
                              cfg.isEnabled 
                                ? 'bg-accent text-primary border-amber-100/50' 
                                : 'bg-muted text-muted-foreground/60 border-border/50'
                            }`}>
                              {cfg.category === 'ORDERS' && <ShoppingCart className="h-4 w-4" />}
                              {cfg.category === 'INVENTORY' && <AlertTriangle className="h-4 w-4" />}
                              {cfg.category === 'PRODUCTION' && <Flame className="h-4 w-4" />}
                              {cfg.category === 'SYSTEM' && <Shield className="h-4 w-4" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                {cfg.name}
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                  {cfg.category}
                                </span>
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
                            </div>
                          </div>
                          
                          {/* Toggle Switch */}
                          <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cfg.isEnabled}
                                onChange={(e) => handleToggleConfig(cfg.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-input after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </div>

                        {/* Card Content */}
                        {cfg.isEnabled && (
                          <div className="border-t border-border px-4 py-4 sm:px-5 bg-cream/20">
                            {isEditing ? (
                              // Edit Mode Form
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Título de la Alerta</label>
                                    <input
                                      type="text"
                                      value={configForm.title || ''}
                                      onChange={(e) => setConfigForm(prev => ({ ...prev, title: e.target.value }))}
                                      className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-card"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                                      Sonido Sintetizado
                                      <button 
                                        type="button"
                                        onClick={() => playNotificationSound(configForm.soundType || 'suave')}
                                        className="p-1 text-muted-foreground/60 hover:text-primary rounded-md"
                                        title="Escuchar sonido"
                                      >
                                        <Play className="h-3 w-3 fill-current" />
                                      </button>
                                    </label>
                                    <select
                                      value={configForm.soundType || 'suave'}
                                      onChange={(e) => setConfigForm(prev => ({ ...prev, soundType: e.target.value }))}
                                      className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-card"
                                    >
                                      <option value="suave">Suave (E5-G5)</option>
                                      <option value="alerta">Alerta (E5-C5)</option>
                                      <option value="importante">Importante (A5-E5-A5)</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-foreground mb-1">Cuerpo del Mensaje</label>
                                  <textarea
                                    value={configForm.message || ''}
                                    onChange={(e) => setConfigForm(prev => ({ ...prev, message: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-card resize-none"
                                  />
                                  
                                  {/* Placeholders Help Badge List */}
                                  {PLACEHOLDERS_HELP[cfg.key] && (
                                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                      <span className="text-[10px] text-muted-foreground/60 mr-1">Placeholders:</span>
                                      {PLACEHOLDERS_HELP[cfg.key].map(ph => (
                                        <button
                                          key={ph}
                                          type="button"
                                          onClick={() => {
                                            // Append placeholder to message input
                                            setConfigForm(prev => ({ 
                                              ...prev, 
                                              message: (prev.message || '') + ' ' + ph 
                                            }))
                                          }}
                                          className="text-[10px] font-mono bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary px-1.5 py-0.5 rounded transition-colors"
                                          title="Hacer clic para insertar"
                                        >
                                          {ph}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Roles Checkboxes */}
                                  <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">Roles que Reciben Notificación</label>
                                    <div className="flex flex-wrap gap-2">
                                      {['ADMIN', 'MANAGER', 'BAKER', 'CUSTOMER'].map((role) => {
                                        const isChecked = configForm.targetRoles?.includes(role)
                                        return (
                                          <button
                                            key={role}
                                            type="button"
                                            onClick={() => {
                                              const currentRoles = configForm.targetRoles || []
                                              const newRoles = currentRoles.includes(role)
                                                ? currentRoles.filter(r => r !== role)
                                                : [...currentRoles, role]
                                              setConfigForm(prev => ({ ...prev, targetRoles: newRoles }))
                                            }}
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                              isChecked
                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                          >
                                            {role}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Channels Selection */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Canales de Despacho</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {[
                                        { id: 'IN_APP', label: 'In-App' },
                                        { id: 'PUSH', label: 'Web Push' },
                                        { id: 'TELEGRAM', label: 'Telegram' },
                                      ].map((ch) => {
                                        const currentChannels = configForm.channels ?? ['IN_APP', 'PUSH', 'TELEGRAM']
                                        const isChecked = currentChannels.includes(ch.id)
                                        return (
                                          <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => {
                                              const newChannels = isChecked
                                                ? currentChannels.filter(c => c !== ch.id)
                                                : [...currentChannels, ch.id]
                                              setConfigForm(prev => ({ ...prev, channels: newChannels }))
                                            }}
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                              isChecked
                                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                            }`}
                                          >
                                            {isChecked ? '✓ ' : ''}{ch.label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Threshold Setting */}
                                  {hasThreshold && (
                                    <div>
                                      <label className="block text-xs font-semibold text-foreground mb-1">
                                        Umbral de Disparo ({configForm.thresholds?.unit || 'Unidades'})
                                      </label>
                                      <input
                                        type="number"
                                        value={configForm.thresholds?.threshold || 0}
                                        onChange={(e) => setConfigForm(prev => ({
                                          ...prev,
                                          thresholds: {
                                            threshold: Number(e.target.value),
                                            unit: prev.thresholds?.unit || 'LB'
                                          }
                                        }))}
                                        className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-card"
                                      />
                                      <p className="text-[10px] text-muted-foreground/60 mt-1">Se alerta si el valor cae por debajo de esta cantidad.</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                  <button
                                    onClick={() => setEditingConfigKey(null)}
                                    className="px-3 py-1.5 bg-muted hover:bg-border text-foreground font-semibold rounded-lg text-xs transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSaveConfig(cfg.key)}
                                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-xs transition-colors"
                                  >
                                    Guardar cambios
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Read-only View Mode Summary
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 w-full">
                                    <span className="text-xs font-semibold text-muted-foreground shrink-0">Formato:</span>
                                    <span className="text-xs font-bold text-foreground truncate">"{cfg.title}"</span>
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0 w-full">
                                    <span className="text-xs font-semibold text-muted-foreground shrink-0">Cuerpo:</span>
                                    <span className="text-xs text-muted-foreground truncate">"{cfg.message}"</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-semibold text-muted-foreground">Destinatarios:</span>
                                    {cfg.targetRoles.map(role => (
                                      <span key={role} className="text-[10px] font-bold bg-accent border border-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        {role}
                                      </span>
                                    ))}
                                    {cfg.targetRoles.length === 0 && (
                                      <span className="text-[10px] text-destructive font-medium">Nadie asignado</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                  <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card shrink-0">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 px-1">
                                      Sonido: {cfg.soundType}
                                    </span>
                                    <button 
                                      onClick={() => playNotificationSound(cfg.soundType)}
                                      className="p-1 hover:bg-muted text-muted-foreground hover:text-primary rounded-md transition-colors"
                                      title="Escuchar"
                                    >
                                      <Volume2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  
                                  {cfg.thresholds && (
                                    <div className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1.5 rounded-lg">
                                      Umbral: {cfg.thresholds.threshold} {cfg.thresholds.unit}
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => handleStartEditConfig(cfg)}
                                    className="px-2.5 py-1.5 bg-card border border-border hover:bg-cream text-foreground font-semibold rounded-lg text-xs shadow-sm transition-colors"
                                  >
                                    Configurar
                                  </button>
                                  
                                  <button
                                    onClick={() => handleTestConfig(cfg.key)}
                                    className="px-2.5 py-1.5 bg-accent hover:bg-primary/10 text-primary font-semibold rounded-lg text-xs border border-primary/20/50 transition-colors"
                                    title="Probar Alerta"
                                  >
                                    Probar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab: Sucursales */}
            {activeTab === "sucursales" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Sucursales
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Puntos de venta y retiro de pedidos.</p>
                  </div>
                  <Link href="/admin/sucursales/nuevo">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                      + Agregar Sucursal
                    </Button>
                  </Link>
                </div>

                {branches.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/60">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p>No hay sucursales registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {branches.map(branch => (
                      <div 
                        key={branch.id}
                        className="flex items-center justify-between p-4 bg-cream rounded-lg hover:bg-muted transition-colors gap-3"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Store className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{branch.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{branch.address}</p>
                            {branch.phone && branch.phone.trim() ? (
                              <p className="text-xs text-primary font-medium mt-0.5">Tel: {branch.phone.trim()}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground/60 italic mt-0.5">Sin teléfono asignado (oculto en la web)</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground/60 font-mono hidden sm:inline">{branch.slug}</span>
                          <Link href={`/admin/sucursales/${branch.id}`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-accent/40 border border-primary/20 rounded-xl p-4 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Gestión detallada de sucursales</p>
                    <p className="text-xs text-muted-foreground">Para administrar inventarios, direcciones o eliminar puntos de venta, usa el módulo principal.</p>
                  </div>
                  <Link href="/admin/sucursales">
                    <Button variant="outline" size="sm" className="whitespace-nowrap border-primary/40 text-primary hover:bg-primary/10">
                      Ir a Sucursales →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Tab: Asistente & Bot IA */}
            {activeTab === "asistente" && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary shrink-0" />
                      <span>Asistente & Bot IA</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Diagnóstico en tiempo real del Webhook de Telegram y gestión dinámica de proveedores y modelos de Inteligencia Artificial.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAssistantData}
                      disabled={isLoadingAssistant}
                      className="text-xs w-full sm:w-auto justify-center"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingAssistant ? 'animate-spin' : ''}`} />
                      Actualizar Estado
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAssistantConfig}
                      disabled={isSavingAssistant}
                      className="bg-primary hover:bg-primary/90 text-white text-xs w-full sm:w-auto justify-center"
                    >
                      {isSavingAssistant ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 1. Telegram Webhook Health Card */}
                <div className="bg-cream/50 rounded-xl border border-border p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">Bot de Telegram</span>
                          {telegramDiagnostics?.configured ? (
                            telegramDiagnostics?.webhookInfo?.lastErrorMessage ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 whitespace-nowrap shrink-0">
                                <AlertCircle className="h-3 w-3" />
                                Error de entrega
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                                <CheckCircle2 className="h-3 w-3" />
                                Webhook Activo
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                              <AlertTriangle className="h-3 w-3" />
                              Sin Token
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {telegramDiagnostics?.botUsername ? `@${telegramDiagnostics.botUsername}` : 'Bot no configurado en entorno'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncWebhook}
                      disabled={isSyncingWebhook}
                      className="text-xs w-full sm:w-auto shrink-0 justify-center"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncingWebhook ? 'animate-spin' : ''}`} />
                      Re-sincronizar Webhook
                    </Button>
                  </div>

                  {/* Webhook details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-card p-3 rounded-lg border border-border min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground">URL de Webhook Registrada</p>
                      <p className="text-xs font-mono font-semibold text-foreground break-all mt-0.5 select-all" title={telegramDiagnostics?.webhookInfo?.url || 'No registrada'}>
                        {telegramDiagnostics?.webhookInfo?.url || 'No registrada'}
                      </p>
                    </div>
                    <div className="bg-card p-3 rounded-lg border border-border">
                      <p className="text-[11px] font-medium text-muted-foreground">Mensajes en Cola (Telegram)</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${telegramDiagnostics?.webhookInfo?.pendingUpdateCount === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <span>{telegramDiagnostics?.webhookInfo?.pendingUpdateCount ?? 0} pendientes</span>
                      </p>
                    </div>
                    <div className="bg-card p-3 rounded-lg border border-border min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground">Certificado SSL / IP</p>
                      <p className="text-xs font-mono text-muted-foreground break-all mt-0.5">
                        {telegramDiagnostics?.webhookInfo?.ipAddress || 'Servidor Render'}
                      </p>
                    </div>
                  </div>

                  {/* If last error exists from Telegram */}
                  {telegramDiagnostics?.webhookInfo?.lastErrorMessage && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs text-destructive flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Último error reportado por Telegram:</p>
                        <p className="font-mono mt-0.5 break-all">{telegramDiagnostics.webhookInfo.lastErrorMessage}</p>
                        {telegramDiagnostics.webhookInfo.lastErrorDate && (
                          <p className="text-[11px] text-destructive/80 mt-1">
                            Fecha del error: {new Date(telegramDiagnostics.webhookInfo.lastErrorDate).toLocaleString('es-GT')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Active Provider Selector Card */}
                <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Proveedor Principal de Inteligencia Artificial</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Elige el proveedor preferido para atender consultas de inventario, recetas y reportes. En modo automático, si el proveedor gratuito falla o excede cuota, el sistema conmuta automáticamente al siguiente.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                    {[
                      { id: 'auto', label: 'Automático', hint: 'Conmutación inteligente' },
                      { id: 'gemini', label: 'Google Gemini', hint: 'Recomendado' },
                      { id: 'groq', label: 'Groq Cloud', hint: 'Ultra rápido' },
                      { id: 'mistral', label: 'Mistral AI', hint: 'Modelos europeos' },
                      { id: 'nvidia', label: 'NVIDIA NIM', hint: 'Open weights' },
                    ].map((prov, idx) => {
                      const isSelected = selectedPrimaryProvider === prov.id
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setSelectedPrimaryProvider(prov.id)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                          } ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-2xs'
                              : 'border-border bg-card hover:bg-cream/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full gap-1">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {prov.label}
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{prov.hint}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Provider Diagnostics and Model Matrix */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Modelos Configurados y Pruebas en Tiempo Real</h3>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Prueba la conexión antes de guardar para verificar si el modelo sigue activo.
                    </span>
                  </div>

                  {isLoadingAssistant ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-xs">Consultando proveedores y modelos de IA...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {assistantDiagnostics?.providers?.map((provider) => {
                        const isTesting = Boolean(isTestingProvider[provider.name])
                        const testResult = testResults[provider.name]
                        const currentModelVal = providerModels[provider.name] ?? provider.activeModel

                        return (
                          <div
                            key={provider.name}
                            className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-border/80 transition-colors"
                          >
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-bold text-foreground">{provider.displayName}</h4>
                                  <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                    {provider.name}
                                  </span>
                                </div>
                                <div>
                                  {provider.configured ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                                      <CheckCircle2 className="h-3 w-3" />
                                      API Key Activa
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                                      <AlertTriangle className="h-3 w-3" />
                                      Sin API Key
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Model Input */}
                              <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                  ID del Modelo
                                </label>
                                <input
                                  type="text"
                                  value={currentModelVal}
                                  onChange={(e) =>
                                    setProviderModels((prev) => ({ ...prev, [provider.name]: e.target.value }))
                                  }
                                  placeholder="Ej: gemini-2.5-flash"
                                  className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                                />
                              </div>

                              {/* Recommended Model Chips */}
                              <div>
                                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Modelos recomendados:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {provider.recommendedModels?.map((recModel) => {
                                    const isCurrent = currentModelVal === recModel
                                    return (
                                      <button
                                        key={recModel}
                                        type="button"
                                        onClick={() =>
                                          setProviderModels((prev) => ({ ...prev, [provider.name]: recModel }))
                                        }
                                        className={`text-[11px] font-mono px-2 py-1 rounded-md border transition-colors ${
                                          isCurrent
                                            ? 'bg-primary/10 text-primary border-primary/40 font-semibold'
                                            : 'bg-cream text-foreground border-border hover:bg-muted'
                                        }`}
                                      >
                                        {recModel}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Test Connection Bar */}
                            <div className="pt-3 border-t border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestProvider(provider.name)}
                                disabled={isTesting || !provider.configured}
                                className="text-xs h-8 whitespace-nowrap w-full sm:w-auto justify-center shrink-0"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    Probando...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
                                    Probar Conexión
                                  </>
                                )}
                              </Button>

                              {/* Test Result Indicator */}
                              {testResult && (
                                <div
                                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 w-full sm:w-auto min-w-0 ${
                                    testResult.ok
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-destructive/10 text-destructive border-destructive/20'
                                  }`}
                                  title={testResult.error || 'Conexión exitosa'}
                                >
                                  {testResult.ok ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                      <span className="font-mono truncate">200 OK ({testResult.latencyMs}ms)</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                                      <span className="break-words text-[11px] leading-tight flex-1">{testResult.error || 'Error'}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Save Reminder */}
                <div className="bg-accent/40 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Guardado dinámico sin reinicio</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cualquier modelo o proveedor que actualices aquí se aplica de inmediato al Bot de Telegram sin necesidad de modificar archivos ni reiniciar servidores.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveAssistantConfig}
                    disabled={isSavingAssistant}
                    className="bg-primary hover:bg-primary/90 text-white text-xs w-full sm:w-auto shrink-0 justify-center"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Guardar Configuración
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
