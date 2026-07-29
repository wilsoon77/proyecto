"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Hop as Home } from "lucide-react"

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

function BreadcrumbList({ breadcrumbs, homeHref }: { breadcrumbs: BreadcrumbItem[]; homeHref: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        <li>
          <Link href={homeHref} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Home className="h-4 w-4" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            {crumb.isCurrent ? (
              <span className="font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Breadcrumbs() {
  const pathname = usePathname()

  if (pathname === "/" || pathname === "/admin" || pathname === "/empleado") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isCurrent = index === segments.length - 1

    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
                 /^\d+$/.test(segment)

    let label = PATH_NAMES[segment] || segment

    if (isId) {
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

  return <BreadcrumbList breadcrumbs={breadcrumbs} homeHref={pathname.startsWith("/empleado") ? "/empleado" : "/admin"} />
}

interface BreadcrumbsWithTitleProps {
  currentPageTitle?: string
}

export function BreadcrumbsWithTitle({ currentPageTitle }: BreadcrumbsWithTitleProps) {
  const pathname = usePathname()

  if (pathname === "/" || pathname === "/admin" || pathname === "/empleado") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isCurrent = index === segments.length - 1

    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
                 /^\d+$/.test(segment)

    let label = PATH_NAMES[segment] || segment

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

  return <BreadcrumbList breadcrumbs={breadcrumbs} homeHref={pathname.startsWith("/empleado") ? "/empleado" : "/admin"} />
}
