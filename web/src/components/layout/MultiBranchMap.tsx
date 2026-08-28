"use client"

import { useEffect, useRef, useState } from "react"
import { STATIC_BRANCHES } from "@/lib/branches"

interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap
  fitBounds(bounds: [number, number][], options: { padding: [number, number] }): void
  remove(): void
}

interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker
  bindPopup(content: string): LeafletMarker
}

interface LeafletApi {
  map(container: HTMLElement, options: { zoomControl: boolean; scrollWheelZoom: boolean }): LeafletMap
  tileLayer(url: string, options: { attribution: string; maxZoom: number }): { addTo(map: LeafletMap): void }
  divIcon(options: {
    className: string
    html: string
    iconSize: [number, number]
    iconAnchor: [number, number]
    popupAnchor: [number, number]
  }): object
  marker(center: [number, number], options: { icon: object }): LeafletMarker
}

declare global {
  interface Window {
    L?: LeafletApi
  }
}

export default function MultiBranchMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    let mapInstance: LeafletMap | null = null

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
      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const L = window.L
      if (!L || !mapRef.current) return

      // Prevenir inicialización duplicada
      if (mapRef.current.hasChildNodes()) {
        mapRef.current.innerHTML = ""
      }

      // Inicializar Mapa centrado en Chimaltenango
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([14.6619, -90.8276], 13)
      mapInstance = map

      // Agregar tiles de OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Icono personalizado para las sucursales de la panadería
      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: #c35a42;
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

        const marker = L.marker([b.lat, b.lng], { icon: customIcon }).addTo(map)
        
        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <strong style="font-size: 14px; color: #111827; display: block; font-family: serif;">${b.name}</strong>
            <p style="margin: 4px 0; font-size: 12px; color: #4b5563; line-height: 1.3;">${b.address}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #c35a42; font-weight: 600;">Tel: ${b.phone}</p>
            <a href="${b.mapsUrl}" target="_blank" rel="noreferrer" style="
              display: inline-block;
              margin-top: 6px;
              font-size: 11px;
              color: white;
              background-color: #c35a42;
              padding: 5px 10px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
            ">
              Abrir en Google Maps &rarr;
            </a>
          </div>
        `
        marker.bindPopup(popupContent)
      })

      // Ajustar vista para encuadrar ambos marcadores con margen suficiente
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60] })
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
      <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
        <div ref={mapRef} className="h-[450px] w-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/90 text-sm font-medium text-muted-foreground">
            Cargando mapa de sucursales en Chimaltenango...
          </div>
        )}

        {/* Indicador de Marcadores en el Mapa */}
        <div className="absolute right-3 top-3 z-10 space-y-1 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
          <p className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            2 sucursales activas
          </p>
          <p className="text-[11px] text-muted-foreground">Chimaltenango, Guatemala</p>
        </div>
      </div>
    </div>
  )
}
