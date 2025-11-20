"use client"

import { MapPin, Phone, Clock, Navigation } from "lucide-react"

const BRANCHES = [
  {
    id: 1,
    name: "Sucursal Central",
    address: "Zona 10, Guatemala City",
    phone: "+502 1234-5678",
    hours: "Lun-Dom: 7:00 AM - 8:00 PM",
    maps: "https://www.google.com/maps/search/?api=1&query=Zona+10+Guatemala+City",
  },
  {
    id: 2,
    name: "Sucursal Norte",
    address: "Zona 18, Guatemala City",
    phone: "+502 8765-4321",
    hours: "Lun-Sáb: 7:00 AM - 7:00 PM",
    maps: "https://www.google.com/maps/search/?api=1&query=Zona+18+Guatemala+City",
  },
]

export default function SucursalesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Nuestras sucursales</h1>
      <p className="mb-8 text-gray-600">Encuentra la panadería más cercana.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {BRANCHES.map(b => (
          <div key={b.id} className="rounded-lg border bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-900">{b.name}</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>{b.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${b.phone.replace(/[^\d+]/g, '')}`} className="hover:text-primary">{b.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{b.hours}</span>
              </li>
            </ul>
            <div className="mt-4">
              <a href={b.maps} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-700 transition-colors hover:border-primary hover:text-primary">
                <Navigation className="h-4 w-4" /> Ver en mapa
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
