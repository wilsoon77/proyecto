"use client"

import Link from "next/link"
import { ROUTES } from "@/lib/constants"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl">🧭</div>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Página no encontrada</h1>
      <p className="mt-2 text-gray-600">La ruta que buscas no existe o fue movida.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={ROUTES.home} className="rounded-md bg-primary px-4 py-2 text-white">Ir al inicio</Link>
        <Link href={ROUTES.products} className="rounded-md border px-4 py-2 text-gray-700 hover:border-primary hover:text-primary">Ver productos</Link>
      </div>
    </div>
  )
}
