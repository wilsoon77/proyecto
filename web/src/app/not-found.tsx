"use client"

import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Compass, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center animate-fade-up">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 shadow-sm">
        <Compass className="h-10 w-10 stroke-[1.8]" />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-sm">
        La ruta que buscas no existe o fue movida a otra ubicación.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <Link href={ROUTES.home} className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto font-semibold shadow-warm h-11 px-6 touch-tactile">
            <Home className="mr-2 h-4 w-4" /> Ir al Inicio
          </Button>
        </Link>
        <Link href={ROUTES.products} className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium h-11 px-6 border-border hover:bg-muted/50 touch-tactile">
            Ver Productos <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
