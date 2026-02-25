"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

// Mapeo de rutas a nombres legibles
const PATH_NAMES: Record<string, string> = {
  admin: "Admin",
  productos: "Productos",
  nuevo: "Nuevo",
  editar: "Editar",
  ordenes: "Pedidos",
  inventario: "Inventario",
  movimiento: "Nuevo Movimiento",
  categorias: "Categorías",
  sucursales: "Sucursales",
  usuarios: "Usuarios",
  historial: "Historial de Cambios",
  empleado: "Empleado",
  reportes: "Reportes",
  configuracion: "Configuración",
}

interface BreadcrumbItem {
  label: string
  href: string
  isCurrent: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // No mostrar breadcrumbs en la página principal
  if (pathname === "/" || pathname === "/admin" || pathname === "/empleado") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)
  
  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isCurrent = index === segments.length - 1
    
    // Detectar si es un ID (UUID o número)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                 /^\d+$/.test(segment)
    
    let label = PATH_NAMES[segment] || segment
    
    if (isId) {
      // Si es un ID, usar "Detalle" o el nombre del padre
      const parentSegment = segments[index - 1]
      if (parentSegment === "productos") label = "Detalle"
      else if (parentSegment === "usuarios") label = "Detalle"
      else if (parentSegment === "ordenes") label = "Pedido"
      else if (parentSegment === "sucursales") label = "Detalle"
      else if (parentSegment === "categorias") label = "Detalle"
      else label = "Detalle"
    }
    
    return { label, href, isCurrent }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        {/* Home link */}
        <li>
          <Link 
            href={pathname.startsWith("/empleado") ? "/empleado" : "/admin"}
            className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {crumb.isCurrent ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="text-gray-500 hover:text-amber-600 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Versión con override manual del nombre actual
interface BreadcrumbsWithTitleProps {
  currentPageTitle?: string
}

export function BreadcrumbsWithTitle({ currentPageTitle }: BreadcrumbsWithTitleProps) {
  const pathname = usePathname()

  // No mostrar breadcrumbs en la página principal
  if (pathname === "/" || pathname === "/admin" || pathname === "/empleado") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)
  
  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isCurrent = index === segments.length - 1
    
    // Detectar si es un ID
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                 /^\d+$/.test(segment)
    
    let label = PATH_NAMES[segment] || segment
    
    // Si es el último elemento y tenemos un título custom, usarlo
    if (isCurrent && currentPageTitle) {
      label = currentPageTitle
    } else if (isId) {
      const parentSegment = segments[index - 1]
      if (parentSegment === "productos") label = "Detalle"
      else if (parentSegment === "usuarios") label = "Detalle"
      else if (parentSegment === "ordenes") label = "Pedido"
      else if (parentSegment === "sucursales") label = "Detalle"
      else if (parentSegment === "categorias") label = "Detalle"
      else label = "Detalle"
    }
    
    return { label, href, isCurrent }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        {/* Home link */}
        <li>
          <Link 
            href={pathname.startsWith("/empleado") ? "/empleado" : "/admin"}
            className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {crumb.isCurrent ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="text-gray-500 hover:text-amber-600 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
