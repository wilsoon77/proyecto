"use client"

import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Home, ArrowRight, ShoppingBag, Store, Wheat } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-background text-foreground animate-fade-up">
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center text-center">
        
        {/* Número 404 Estilizado con Calidez de Panadería */}
        <div className="relative mb-2 flex items-center justify-center">
          <span className="font-display text-8xl sm:text-9xl font-black text-[#D97706]/15 tracking-tighter select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#DECDBB] bg-[#FAF0E6] text-[#D97706] shadow-sm">
              <Wheat className="h-10 w-10 stroke-[1.8]" />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-900">
          Esta receta no existe
        </div>

        {/* Título Principal */}
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#24140D]">
          Página no encontrada
        </h1>

        {/* Descripción */}
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6E5545] max-w-sm">
          Buscamos por todos los estantes de la panadería, pero la página que estás buscando fue cambiada de lugar o ya no está disponible.
        </p>

        {/* Botones de Acción Táctiles */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link href={ROUTES.home} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 rounded-full px-6 font-bold bg-[#D97706] hover:bg-[#B45309] text-white shadow-warm touch-tactile">
              <Home className="mr-2 h-4 w-4" /> Ir al Inicio
            </Button>
          </Link>
          <Link href={ROUTES.products} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 rounded-full px-6 font-bold border-[#DECDBB] text-[#2B170F] bg-white hover:bg-[#FAF5EE] touch-tactile">
              <ShoppingBag className="mr-2 h-4 w-4 text-[#8C522B]" />
              Ver Productos <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Enlace secundario a Sucursales */}
        <div className="mt-6">
          <Link href={ROUTES.branches} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C522B] hover:text-[#24140D] hover:underline transition-colors">
            <Store className="h-3.5 w-3.5" /> O visita una de nuestras sucursales
          </Link>
        </div>

      </div>
    </div>
  )
}
