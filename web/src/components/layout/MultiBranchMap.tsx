"use client"

import { useEffect, useRef, useState } from "react"

export interface BranchLocation {
  id: string
  name: string
  address: string
  phone: string
  schedule: string
  lat: number
  lng: number
  mapsUrl: string
}

export const STATIC_BRANCHES: BranchLocation[] = [
  {
    id: "central",
    name: "Sucursal Central",
    address: "Aldea Buena Vista, Zona 8, Sector Sur, Chimaltenango",
    phone: "+502 1234-5678",
    schedule: "Lunes a Sábado: 7:00 AM - 8:00 PM",
    lat: 14.664106,
    lng: -90.845432,
    mapsUrl: "https://maps.app.goo.gl/T9saBh42VUrirRSYA",
  },
  {
    id: "secundaria",
    name: "Sucursal Secundaria",
    address: "Frente a Pradera Chimaltenango, Chimaltenango",
    phone: "+502 8765-4321",
    schedule: "Lunes a Sábado: 7:00 AM - 8:00 PM",
    lat: 14.6597265,
    lng: -90.809855,
    mapsUrl: "https://maps.app.goo.gl/hZDJzWiRhHeunxrp7",
  },
]

export default function MultiBranchMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeBranch, setActiveBranch] = useState<BranchLocation | null>(null)

  useEffect(() => {
    let mapInstance: any = null

    const loadLeaflet = async () => {
      // 1. Cargar CSS de Leaflet si no existe
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // 2. Cargar Script de Leaflet si no existe
      if (!(window as any).L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const L = (window as any).L
      if (!L || !mapRef.current) return

      // Prevenir inicialización duplicada
      if (mapRef.current.hasChildNodes()) {
        mapRef.current.innerHTML = ""
      }

      // Inicializar Mapa centrado en Chimaltenango
      mapInstance = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([14.6619, -90.8276], 13)

      // Agregar tiles de OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstance)

      // Icono personalizado para las sucursales de la panadería
      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: #d97706;
            color: white;
            border: 2px solid white;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            cursor: pointer;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32],
      })

      const bounds: [number, number][] = []

      // Agregar marcadores para ambas sucursales de Chimaltenango simultáneamente
      STATIC_BRANCHES.forEach((b) => {
        bounds.push([b.lat, b.lng])

        const marker = L.marker([b.lat, b.lng], { icon: customIcon }).addTo(mapInstance)
        
        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <strong style="font-size: 14px; color: #111827;">${b.name}</strong>
            <p style="margin: 4px 0; font-size: 12px; color: #4b5563; line-height: 1.3;">${b.address}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #d97706; font-weight: 600;">📞 ${b.phone}</p>
            <a href="${b.mapsUrl}" target="_blank" rel="noreferrer" style="
              display: inline-block;
              margin-top: 6px;
              font-size: 11px;
              color: white;
              background-color: #d97706;
              padding: 5px 10px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
            ">
              📍 Abrir en Google Maps
            </a>
          </div>
        `
        marker.bindPopup(popupContent)

        marker.on("click", () => {
          setActiveBranch(b)
        })
      })

      // Ajustar vista para encuadrar ambos marcadores con margen suficiente
      if (bounds.length > 0) {
        mapInstance.fitBounds(bounds, { padding: [60, 60] })
      }

      setMapLoaded(true)
    }

    loadLeaflet()

    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Visualizador del Mapa con los 2 Marcadores en Chimaltenango */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-md">
        <div ref={mapRef} className="h-[450px] w-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 text-gray-500 text-sm font-medium z-10">
            Cargando mapa de sucursales en Chimaltenango…
          </div>
        )}

        {/* Indicador de Marcadores en el Mapa */}
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs space-y-1">
          <p className="font-bold text-gray-900 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600 inline-block" />
            2 Sucursales Activas
          </p>
          <p className="text-[11px] text-gray-500">Chimaltenango, Guatemala</p>
        </div>
      </div>
    </div>
  )
}
