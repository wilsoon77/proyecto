/**
 * Helpers para interpretar y formatear registros de auditoría
 * de forma legible para administradores.
 */

// ── Traducciones ──────────────────────────────────────────

export const ACTION_LABELS: Record<string, string> = {
  CREATE: "Crear",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  STATUS_CHANGE: "Cambio de estado",
}

export const ENTITY_LABELS: Record<string, string> = {
  Product: "Producto",
  Order: "Pedido",
  User: "Usuario",
  Branch: "Sucursal",
  Category: "Categoría",
  Inventory: "Inventario",
  StockMovement: "Movimiento de Stock",
}

/** Campos conocidos y sus etiquetas legibles */
const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  sku: "SKU",
  price: "Precio",
  description: "Descripción",
  categorySlug: "Categoría",
  category: "Categoría",
  slug: "Slug",
  isNew: "Es nuevo",
  discount: "Descuento",
  discountPercent: "% Descuento",
  imageUrl: "Imagen",
  firstName: "Nombre",
  lastName: "Apellido",
  email: "Email",
  phone: "Teléfono",
  role: "Rol",
  branchId: "Sucursal",
  branchSlug: "Sucursal",
  status: "Estado",
  newStatus: "Nuevo estado",
  previousStatus: "Estado anterior",
  action: "Acción",
  changedFields: "Campos modificados",
  method: "Método",
  password: "Contraseña",
  total: "Total",
  itemsCount: "Productos",
  deleted: "Eliminado",
  active: "Activo",
  address: "Dirección",
  zone: "Zona",
}

/** Valores conocidos y su traducción */
const VALUE_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo para recoger",
  PICKED_UP: "Recogido",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  IN_DELIVERY: "En camino",
  ADMIN: "Administrador",
  EMPLOYEE: "Empleado",
  CUSTOMER: "Cliente",
  DEACTIVATE: "Desactivar",
  ACTIVATE: "Activar",
  CANCEL: "Cancelar",
  CONFIRM: "Confirmar",
  PICKUP: "Entregar/Recoger",
  STATUS_CHANGE: "Cambio de estado",
}

function labelField(key: string): string {
  return FIELD_LABELS[key] || key
}

function labelValue(val: unknown): string {
  if (val === null || val === undefined) return "—"
  if (val === true) return "Sí"
  if (val === false) return "No"
  if (typeof val === "number") return String(val)
  const s = String(val)
  return VALUE_LABELS[s] || s
}

// ── Resumen legible ───────────────────────────────────────

export interface AuditSummary {
  /** Frase corta ej. "Se creó el producto Pan Francés" */
  headline: string
  /** Lista de pares clave/valor legibles para los detalles */
  items: { label: string; value: string }[]
  /** Campos modificados (solo para UPDATE con changedFields) */
  changedFields?: string[]
}

export function summarizeAudit(
  action: string,
  entity: string,
  entityName: string | null | undefined,
  details: Record<string, unknown> | string | null | undefined,
): AuditSummary {
  const entityLabel = ENTITY_LABELS[entity] || entity
  const name = entityName || ""
  const det = parseDetails(details)

  // ── Headline ──
  let headline = ""
  const subAction = det?.action ? String(det.action) : null

  switch (action) {
    case "CREATE":
      headline = `Se creó ${article(entityLabel)} ${entityLabel.toLowerCase()}${name ? `: ${name}` : ""}`
      break
    case "UPDATE":
      if (subAction === "DEACTIVATE") {
        headline = `Se desactivó ${article(entityLabel)} ${entityLabel.toLowerCase()}${name ? `: ${name}` : ""}`
      } else if (subAction === "ACTIVATE") {
        headline = `Se reactivó ${article(entityLabel)} ${entityLabel.toLowerCase()}${name ? `: ${name}` : ""}`
      } else if (subAction === "CANCEL") {
        headline = `Se canceló el pedido${name ? ` ${name}` : ""}`
      } else if (subAction === "CONFIRM") {
        headline = `Se confirmó el pedido${name ? ` ${name}` : ""}`
      } else if (subAction === "PICKUP") {
        headline = `Se entregó el pedido${name ? ` ${name}` : ""}`
      } else if (subAction === "STATUS_CHANGE" || det?.newStatus) {
        const ns = labelValue(det?.newStatus)
        headline = `Se cambió el estado del pedido${name ? ` ${name}` : ""} a "${ns}"`
      } else if (det?.changedFields) {
        const fields = Array.isArray(det.changedFields)
          ? det.changedFields.map(f => labelField(String(f))).join(", ")
          : String(det.changedFields)
        headline = `Se actualizó ${article(entityLabel)} ${entityLabel.toLowerCase()}${name ? `: ${name}` : ""} (${fields})`
      } else {
        headline = `Se actualizó ${article(entityLabel)} ${entityLabel.toLowerCase()}${name ? `: ${name}` : ""}`
      }
      break
    case "DELETE":
      headline = `Se eliminó ${article(entityLabel)} ${entityLabel.toLowerCase()}${name ? `: ${name}` : ""}`
      break
    case "LOGIN":
      headline = `Inicio de sesión${name ? ` de ${name}` : ""}`
      break
    case "LOGOUT":
      headline = `Cierre de sesión${name ? ` de ${name}` : ""}`
      break
    default:
      headline = `${ACTION_LABELS[action] || action}: ${entityLabel}${name ? ` ${name}` : ""}`
  }

  // ── Detail items ──
  const items: { label: string; value: string }[] = []
  let changedFields: string[] | undefined

  if (det) {
    for (const [key, val] of Object.entries(det)) {
      if (key === "changedFields" && Array.isArray(val)) {
        changedFields = val.map(f => labelField(String(f)))
        items.push({ label: "Campos modificados", value: changedFields.join(", ") })
      } else if (key === "action" || key === "method") {
        // skip internal keys from the headline
        if (key === "method") items.push({ label: "Vía", value: labelValue(val) })
      } else {
        items.push({ label: labelField(key), value: labelValue(val) })
      }
    }
  }

  return { headline, items, changedFields }
}

// ── Helpers internos ──────────────────────────────────────

function parseDetails(
  details: Record<string, unknown> | string | null | undefined,
): Record<string, unknown> | null {
  if (!details) return null
  if (typeof details === "string") {
    try {
      return JSON.parse(details) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return details
}

/** Artículo indefinido correcto para español */
function article(word: string): string {
  // Palabras femeninas conocidas
  const fem = ["categoría", "sucursal"]
  return fem.includes(word.toLowerCase()) ? "la" : "el"
}
