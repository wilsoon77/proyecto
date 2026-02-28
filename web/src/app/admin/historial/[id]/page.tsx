"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  User,
  Package,
  ShoppingCart,
  Building2,
  Tag,
  RefreshCcw,
  Clock,
  Globe,
  Monitor,
  FileText,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { auditService, type AuditLog } from "@/lib/api"
import { summarizeAudit, ACTION_LABELS, ENTITY_LABELS } from "@/lib/audit-helpers"

// Iconos por entidad
const ENTITY_ICONS: Record<string, React.ElementType> = {
  Product: Package,
  Order: ShoppingCart,
  User: User,
  Branch: Building2,
  Category: Tag,
  Inventory: Package,
  StockMovement: RefreshCcw,
}

// Colores por acción
const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: "bg-green-100", text: "text-green-700" },
  UPDATE: { bg: "bg-blue-100", text: "text-blue-700" },
  DELETE: { bg: "bg-red-100", text: "text-red-700" },
  LOGIN: { bg: "bg-purple-100", text: "text-purple-700" },
  LOGOUT: { bg: "bg-gray-100", text: "text-gray-700" },
  STATUS_CHANGE: { bg: "bg-amber-100", text: "text-amber-700" },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function HistorialDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const id = params.id as string

  const [log, setLog] = useState<AuditLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const data = await auditService.getById(id)
        setLog(data)
      } catch (error) {
        console.error("Error loading audit log:", error)
        showToast("Error al cargar el registro", "error")
        router.push("/admin/historial")
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <p className="text-center text-gray-500">Registro no encontrado</p>
      </div>
    )
  }

  const EntityIcon = ENTITY_ICONS[log.entity] || Package
  const actionColor = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE
  const summary = summarizeAudit(
    log.action,
    log.entity,
    log.entityName,
    log.details as Record<string, unknown> | null,
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/historial">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Detalle de Auditoría</h1>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
        {/* Action + Entity badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${actionColor.bg} ${actionColor.text}`}>
            {ACTION_LABELS[log.action] || log.action}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
            <EntityIcon className="h-3.5 w-3.5" />
            {ENTITY_LABELS[log.entity] || log.entity}
          </span>
        </div>

        {/* Headline */}
        <p className="text-lg font-semibold text-gray-900 mb-1">
          {summary.headline}
        </p>
        {log.entityName && (
          <p className="text-sm text-gray-500">
            {ENTITY_LABELS[log.entity] || log.entity}: <span className="font-medium text-gray-700">{log.entityName}</span>
          </p>
        )}
      </div>

      {/* Details Card */}
      {summary.items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            Detalles de la Acción
          </h2>

          <dl className="divide-y divide-gray-100">
            {summary.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-gray-500 sm:w-44 sm:flex-shrink-0">
                  {item.label}
                </dt>
                <dd className="text-sm text-gray-900 break-words">
                  {/* Highlight changed fields */}
                  {item.label === "Campos modificados" ? (
                    <div className="flex flex-wrap gap-1.5">
                      {summary.changedFields?.map((field, i) => (
                        <span
                          key={i}
                          className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Metadata Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Información del Registro</h2>

        <dl className="space-y-4">
          {/* User */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Usuario</dt>
              <dd className="text-sm text-gray-900 font-medium">{log.userName}</dd>
              {log.user?.email && (
                <dd className="text-xs text-gray-500">{log.user.email}</dd>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Fecha y Hora</dt>
              <dd className="text-sm text-gray-900">{formatDate(log.createdAt)}</dd>
            </div>
          </div>

          {/* Entity ID */}
          {log.entityId && (
            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">ID de Entidad</dt>
                <dd className="text-sm text-gray-900 font-mono">{log.entityId}</dd>
              </div>
            </div>
          )}

          {/* IP Address */}
          {log.ipAddress && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Dirección IP</dt>
                <dd className="text-sm text-gray-900 font-mono">{log.ipAddress}</dd>
              </div>
            </div>
          )}

          {/* User Agent */}
          {log.userAgent && (
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Navegador</dt>
                <dd className="text-sm text-gray-600 break-all">{log.userAgent}</dd>
              </div>
            </div>
          )}
        </dl>
      </div>

      {/* Raw JSON (collapsible) */}
      {log.details && (
        <details className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 select-none">
            Ver datos crudos (JSON)
          </summary>
          <pre className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
            {typeof log.details === "object"
              ? JSON.stringify(log.details, null, 2)
              : String(log.details)}
          </pre>
        </details>
      )}
    </div>
  )
}
