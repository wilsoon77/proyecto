/**
 * Barrel file — unifica el sistema de toast para toda la app.
 * Tanto las páginas públicas como las admin importan desde aquí
 * o desde @/context/ToastContext (misma implementación).
 */
export { ToastProvider, useToast } from "@/context/ToastContext"
