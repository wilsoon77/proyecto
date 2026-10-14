export interface BranchLocation {
  id: string
  name: string
  address: string
  phone?: string
  schedule: string
  lat: number
  lng: number
  mapsUrl: string
}

// Enlaces a los puntos de las sucursales en Google Maps
export const GOOGLE_MAPS_BRANCH_URLS: Record<string, string> = {
  central: "https://maps.app.goo.gl/T9saBh42VUrirRSYA",
  secundaria: "https://maps.app.goo.gl/hZDJzWiRhHeunxrp7",
}

export function getBranchGoogleMapsUrl(branch: {
  slug?: string
  id?: number | string
  latitude?: number | null
  longitude?: number | null
  address?: string
  name?: string
}): string {
  const key = (branch.slug || String(branch.id || '')).toLowerCase()
  if (GOOGLE_MAPS_BRANCH_URLS[key]) {
    return GOOGLE_MAPS_BRANCH_URLS[key]
  }

  if (branch.latitude && branch.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name || ''}, ${branch.address || ''}, Guatemala`)}`
}

export const STATIC_BRANCHES: BranchLocation[] = [
  {
    id: "central",
    name: "Panadería Buena Vista",
    address: "Aldea Buena Vista, Zona 8, Sector Sur, Chimaltenango",
    phone: "",
    schedule: "Lunes a Sábado: 6:00 AM - 8:00 PM",
    lat: 14.664106,
    lng: -90.845432,
    mapsUrl: GOOGLE_MAPS_BRANCH_URLS.central,
  },
  {
    id: "secundaria",
    name: "Panadería Secundaria",
    address: "Frente a Pradera Chimaltenango, Chimaltenango",
    phone: "",
    schedule: "Lunes a Sábado: 6:00 AM - 8:00 PM",
    lat: 14.6597265,
    lng: -90.809855,
    mapsUrl: GOOGLE_MAPS_BRANCH_URLS.secundaria,
  },
]
