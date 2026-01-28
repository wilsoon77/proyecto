"use client"

import { useEffect, useState, useMemo } from "react"
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react"
import { branchesService } from "@/lib/api"
import type { ApiBranch } from "@/lib/api/types"
import { Button } from "@/components/ui/button"

// Centro por defecto: Guatemala City
const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 }

// API Key de Google Maps (usar variable de entorno en producción)
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'

export default function SucursalesPage() {
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(null)

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await branchesService.list()
        setBranches(data)
        if (data.length > 0) {
          setSelectedBranch(data[0])
        }
      } catch (err) {
        console.error('Error cargando sucursales:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadBranches()
  }, [])

  // Construir URL de Google Maps Embed
  const mapEmbedUrl = useMemo(() => {
    if (selectedBranch?.latitude && selectedBranch?.longitude) {
      return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${selectedBranch.latitude},${selectedBranch.longitude}&zoom=15`
    }
    // Fallback a búsqueda por dirección
    if (selectedBranch?.address) {
      const query = encodeURIComponent(`${selectedBranch.name}, ${selectedBranch.address}, Guatemala`)
      return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${query}&zoom=15`
    }
    // Centro de Guatemala por defecto
    return `https://www.google.com/maps/embed/v1/view?key=${MAPS_API_KEY}&center=${DEFAULT_CENTER.lat},${DEFAULT_CENTER.lng}&zoom=12`
  }, [selectedBranch])

  // URL para abrir en Google Maps
  const getGoogleMapsUrl = (branch: ApiBranch) => {
    if (branch.latitude && branch.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Nuestras sucursales</h1>
        <p className="mb-8 text-gray-600">Encuentra la panadería más cercana.</p>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-lg border bg-white p-6">
                <div className="h-6 w-3/4 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-full rounded bg-gray-200" />
                <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Nuestras sucursales</h1>
      <p className="mb-8 text-gray-600">Encuentra la panadería más cercana y visítanos.</p>

      {branches.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No hay sucursales disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de sucursales */}
          <div className="lg:col-span-1 space-y-4">
            {branches.map(branch => (
              <div 
                key={branch.id} 
                className={`cursor-pointer rounded-lg border bg-white p-5 transition-all hover:border-primary hover:shadow-md ${
                  selectedBranch?.id === branch.id ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setSelectedBranch(branch)}
              >
                <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{branch.address}</span>
                  </li>
                  {branch.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                      <a 
                        href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`} 
                        className="hover:text-primary"
                        onClick={e => e.stopPropagation()}
                      >
                        {branch.phone}
                      </a>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>Lun-Dom: 7:00 AM - 8:00 PM</span>
                  </li>
                </ul>
                <div className="mt-4 flex gap-2">
                  <a 
                    href={getGoogleMapsUrl(branch)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    <Navigation className="h-3.5 w-3.5" /> 
                    Cómo llegar
                  </a>
                  <span className="text-gray-300">|</span>
                  <a 
                    href={getGoogleMapsUrl(branch)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> 
                    Abrir mapa
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 overflow-hidden rounded-lg border bg-gray-100 shadow-sm">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${selectedBranch?.name || 'sucursales'}`}
                className="w-full"
              />
              {selectedBranch && (
                <div className="border-t bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedBranch.name}</h4>
                      <p className="text-sm text-gray-600">{selectedBranch.address}</p>
                    </div>
                    <a 
                      href={getGoogleMapsUrl(selectedBranch)} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Button size="sm">
                        <Navigation className="mr-2 h-4 w-4" />
                        Ir ahora
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
