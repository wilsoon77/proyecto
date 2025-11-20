"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

const PROMOS = [
  { id: 1, title: "Combo desayuno", desc: "Pan francés + café pequeño.", badge: "-20%", color: "bg-rose-100 text-rose-700" },
  { id: 2, title: "2x1 en galletas", desc: "Sábados de 3 a 5 pm.", badge: "HOY", color: "bg-amber-100 text-amber-700" },
  { id: 3, title: "Pastel pequeño en oferta", desc: "Precio especial por tiempo limitado.", badge: "-15%", color: "bg-emerald-100 text-emerald-700" },
]

export default function PromocionesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Promociones</h1>
      <p className="mb-8 text-gray-600">Aprovecha nuestras ofertas por tiempo limitado.</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PROMOS.map(p => (
          <div key={p.id} className="rounded-lg border bg-white p-6">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${p.color}`}>{p.badge}</span>
            <h3 className="mt-3 text-xl font-semibold text-gray-900">{p.title}</h3>
            <p className="mt-1 text-gray-600">{p.desc}</p>
            <div className="mt-4">
              <Link href={ROUTES.products}><Button>Ver productos</Button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
