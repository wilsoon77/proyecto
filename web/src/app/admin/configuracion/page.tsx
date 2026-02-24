"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { branchesService } from "@/lib/api"

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
  deliveryFee: number
  freeDeliveryMinimum: number
  maxOrderItems: number
  // Notificaciones
  emailNotifications: boolean
  orderConfirmationEmail: boolean
  lowStockAlerts: boolean
  lowStockThreshold: number
  // Operación
  acceptOrders: boolean
  maintenanceMode: boolean
  operatingHours: string
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "Panadería Artesanal",
  storeDescription: "Los mejores panes y pasteles de la ciudad",
  currency: "GTQ",
  timezone: "America/Guatemala",
  minOrderAmount: 25,
  deliveryFee: 15,
  freeDeliveryMinimum: 100,
  maxOrderItems: 50,
  emailNotifications: true,
  orderConfirmationEmail: true,
  lowStockAlerts: true,
  lowStockThreshold: 10,
  acceptOrders: true,
  maintenanceMode: false,
  operatingHours: "06:00 - 20:00",
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [branches, setBranches] = useState<Branch[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "pedidos" | "notificaciones" | "sucursales">("general")

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
      
      // Cargar configuración desde localStorage (en futuro sería de una API)
      const savedSettings = localStorage.getItem("app_settings")
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
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
      // Guardar en localStorage (en futuro sería a una API)
      localStorage.setItem("app_settings", JSON.stringify(settings))
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

  const tabs = [
    { id: "general", label: "General", icon: Store },
    { id: "pedidos", label: "Pedidos", icon: Package },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "sucursales", label: "Sucursales", icon: Building2 },
  ] as const

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="bg-white rounded-xl h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-amber-600" />
            Configuración
          </h1>
          <p className="text-gray-500 mt-1">Administra las opciones del sistema</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-700"
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

      <div className="flex gap-6">
        {/* Sidebar de tabs */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Estado del sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Estado del Sistema</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pedidos</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  settings.acceptOrders ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {settings.acceptOrders ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {settings.acceptOrders ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mantenimiento</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  settings.maintenanceMode ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {settings.maintenanceMode ? 'Activo' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            
            {/* Tab: General */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="h-5 w-5 text-amber-600" />
                    Información del Negocio
                  </h2>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Tienda
                      </label>
                      <input
                        type="text"
                        value={settings.storeName}
                        onChange={(e) => updateSetting("storeName", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={settings.storeDescription}
                        onChange={(e) => updateSetting("storeDescription", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Moneda
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => updateSetting("currency", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                          disabled
                        >
                          <option value="GTQ">GTQ - Quetzal Guatemalteco</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Solo disponible en Guatemala</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zona Horaria
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => updateSetting("timezone", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                          disabled
                        >
                          <option value="America/Guatemala">Guatemala (CST)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline-block h-4 w-4 mr-1" />
                        Horario de Operación
                      </label>
                      <input
                        type="text"
                        value={settings.operatingHours}
                        onChange={(e) => updateSetting("operatingHours", e.target.value)}
                        placeholder="06:00 - 20:00"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Estado de operación */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">Estado de Operación</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Aceptar Pedidos</p>
                          <p className="text-sm text-gray-500">Permite recibir nuevos pedidos</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.acceptOrders}
                        onChange={(e) => updateSetting("acceptOrders", e.target.checked)}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900">Modo Mantenimiento</p>
                          <p className="text-sm text-gray-500">Solo administradores pueden acceder</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => updateSetting("maintenanceMode", e.target.checked)}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Pedidos */}
            {activeTab === "pedidos" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  Configuración de Pedidos
                </h2>

                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Coins className="inline-block h-4 w-4 mr-1" />
                        Monto Mínimo de Pedido
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Q</span>
                        <input
                          type="number"
                          min="0"
                          value={settings.minOrderAmount}
                          onChange={(e) => updateSetting("minOrderAmount", Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Items por Pedido
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.maxOrderItems}
                        onChange={(e) => updateSetting("maxOrderItems", Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Configuración de Envío
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Costo de Envío
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Q</span>
                          <input
                            type="number"
                            min="0"
                            value={settings.deliveryFee}
                            onChange={(e) => updateSetting("deliveryFee", Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mínimo para Envío Gratis
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Q</span>
                          <input
                            type="number"
                            min="0"
                            value={settings.freeDeliveryMinimum}
                            onChange={(e) => updateSetting("freeDeliveryMinimum", Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pedidos mayores a este monto tendrán envío gratis
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notificaciones */}
            {activeTab === "notificaciones" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Configuración de Notificaciones
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Notificaciones por Email</p>
                        <p className="text-sm text-gray-500">Recibir notificaciones generales por email</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => updateSetting("emailNotifications", e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Confirmación de Pedido</p>
                        <p className="text-sm text-gray-500">Enviar email al cliente cuando se confirme su pedido</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.orderConfirmationEmail}
                      onChange={(e) => updateSetting("orderConfirmationEmail", e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">Alertas de Stock Bajo</p>
                        <p className="text-sm text-gray-500">Recibir alerta cuando un producto tenga poco stock</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.lowStockAlerts}
                      onChange={(e) => updateSetting("lowStockAlerts", e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    />
                  </label>

                  {settings.lowStockAlerts && (
                    <div className="ml-12 p-4 border-l-2 border-amber-200 bg-amber-50 rounded-r-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Umbral de Stock Bajo
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={settings.lowStockThreshold}
                          onChange={(e) => updateSetting("lowStockThreshold", Number(e.target.value))}
                          className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-600">unidades</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Se enviará alerta cuando el stock sea menor a este valor
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Sucursales */}
            {activeTab === "sucursales" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-amber-600" />
                    Sucursales
                  </h2>
                  <Button variant="outline" size="sm" disabled>
                    + Agregar Sucursal
                  </Button>
                </div>

                {branches.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay sucursales registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {branches.map(branch => (
                      <div 
                        key={branch.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Store className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{branch.name}</p>
                            <p className="text-sm text-gray-500">{branch.address}</p>
                            {branch.phone && (
                              <p className="text-xs text-gray-400">{branch.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">{branch.slug}</span>
                          <Button variant="ghost" size="sm" disabled>
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-700">
                    <strong>Nota:</strong> La gestión completa de sucursales (crear, editar, eliminar) 
                    estará disponible en una próxima actualización.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
