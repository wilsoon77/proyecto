"use client"

import { useEffect, useState, useMemo } from "react"
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react"
import { branchesService } from "@/lib/api"
import type { ApiBranch } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { useSystemConfig } from "@/context/SystemConfigContext"

// Centro por defecto: Guatemala City
const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 }

// API Key de Google Maps (configurar en variable de entorno)
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''

export default function SucursalesPage() {
  const { config } = useSystemConfig()
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(null)

  const operatingHours = typeof config['store.operating_hours'] === 'string' && config['store.operating_hours'].trim()
    ? config['store.operating_hours'].trim()
    : null

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
    if (MAPS_API_KEY) {
      if (selectedBranch?.latitude && selectedBranch?.longitude) {
        return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${selectedBranch.latitude},${selectedBranch.longitude}&zoom=15`
      }
      if (selectedBranch?.address) {
        const query = encodeURIComponent(`${selectedBranch.name}, ${selectedBranch.address}, Guatemala`)
        return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${query}&zoom=15`
      }
      return `https://www.google.com/maps/embed/v1/view?key=${MAPS_API_KEY}&center=${DEFAULT_CENTER.lat},${DEFAULT_CENTER.lng}&zoom=12`
    }

    // Fallback universal de Google Maps Embed sin necesidad de API Key
    if (selectedBranch?.latitude && selectedBranch?.longitude) {
      return `https://maps.google.com/maps?q=${selectedBranch.latitude},${selectedBranch.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    }
    if (selectedBranch?.address) {
      const query = encodeURIComponent(`${selectedBranch.name}, ${selectedBranch.address}, Guatemala`)
      return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    }
    return `https://maps.google.com/maps?q=Guatemala+City&t=&z=12&ie=UTF8&iwloc=&output=embed`
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
        <h1 className="mb-2 text-3xl font-bold text-foreground">Nuestras sucursales</h1>
        <p className="mb-8 text-muted-foreground">Encuentra la panadería más cercana.</p>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-[#DECDBB] bg-white p-6">
                <div className="h-6 w-3/4 rounded bg-[#FAF5EE]" />
                <div className="mt-3 h-4 w-full rounded bg-[#FAF5EE]" />
                <div className="mt-2 h-4 w-2/3 rounded bg-[#FAF5EE]" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 animate-pulse rounded-2xl border border-[#DECDBB] bg-[#FAF5EE]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-[#24140D]">
        Nuestras sucursales
      </h1>
      <p className="mb-8 text-sm sm:text-base text-[#6E5545]">
        Encuentra la panadería más cercana y visítanos.
      </p>

      {branches.length === 0 ? (
        <div className="rounded-2xl border border-[#DECDBB] bg-white p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-[#D97706]/60 mb-2" />
          <p className="text-sm font-medium text-[#6E5545]">No hay sucursales disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de sucursales */}
          <div className="lg:col-span-1 space-y-4">
            {branches.map(branch => (
              <div 
                key={branch.id} 
                className={`cursor-pointer rounded-2xl border p-5 transition-all shadow-xs ${
                  selectedBranch?.id === branch.id 
                    ? 'border-[#D97706] bg-[#FAF0E6] ring-2 ring-[#D97706]/20' 
                    : 'border-[#DECDBB] bg-white hover:bg-[#FAF5EE] hover:border-[#D97706]/40'
                }`}
                onClick={() => setSelectedBranch(branch)}
              >
                <h3 className="font-display text-lg font-bold text-[#2B170F]">{branch.name}</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#5C3D2E]">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#D97706]" />
                    <span>{branch.address}</span>
                  </li>
                  {branch.phone && branch.phone.trim() && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0 text-[#D97706]" />
                      <a href={`tel:${branch.phone.trim()}`} className="hover:underline text-[#2B170F] font-medium">
                        {branch.phone.trim()}
                      </a>
                    </li>
                  )}
                  {operatingHours && (
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0 text-[#D97706]" />
                      <span>{operatingHours}</span>
                    </li>
                  )}
                </ul>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#DECDBB]/40">
                  <a 
                    href={getGoogleMapsUrl(branch)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706] hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    <Navigation className="h-3.5 w-3.5" /> 
                    Cómo llegar
                  </a>
                  <span className="text-[#DECDBB]">|</span>
                  <a 
                    href={getGoogleMapsUrl(branch)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#8C522B] hover:text-[#2B170F]"
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
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-[#DECDBB] bg-[#FAF5EE] shadow-sm">
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
                <div className="border-t border-[#DECDBB] bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-display text-base sm:text-lg font-bold text-[#2B170F]">{selectedBranch.name}</h4>
                      <p className="text-xs sm:text-sm text-[#6E5545]">{selectedBranch.address}</p>
                    </div>
                    <a 
                      href={getGoogleMapsUrl(selectedBranch)} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Button size="sm" className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl text-xs h-9 px-4 shadow-xs">
                        <Navigation className="mr-1.5 h-3.5 w-3.5" />
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
