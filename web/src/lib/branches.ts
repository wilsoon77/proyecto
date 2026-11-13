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

export const SELECTED_BRANCH_STORAGE_KEY = "selectedBranch"
export const SELECTED_BRANCH_CHANGE_EVENT = "panaderia:selected-branch-changed"

export function getStoredBranchSlug(): string | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.localStorage.getItem(SELECTED_BRANCH_STORAGE_KEY)?.trim()
    return value || null
  } catch {
    return null
  }
}

export function setStoredBranchSlug(slug: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SELECTED_BRANCH_STORAGE_KEY, slug)
    window.dispatchEvent(new CustomEvent(SELECTED_BRANCH_CHANGE_EVENT, { detail: slug }))
  } catch {
    // Ignorar errores si el navegador restringe localStorage
  }
}

export function resolveBranchSelection<T extends { id: number; slug: string }>(
  branches: T[],
  preferred?: string | null,
): T | null {
  if (!branches.length) return null
  const normalized = preferred?.trim().toLowerCase()
  if (!normalized) return branches[0]
  return (
    branches.find(
      (branch) => branch.slug.toLowerCase() === normalized || String(branch.id) === normalized,
    ) ?? branches[0]
  )
}

// Enlaces oficiales verificados en Google Maps
export const GOOGLE_MAPS_BRANCH_URLS: Record<string, string> = {
  central: "https://maps.app.goo.gl/tYQE6vyCkmRYVH8Y8",
  "1": "https://maps.app.goo.gl/tYQE6vyCkmRYVH8Y8",
  secundaria: "https://maps.app.goo.gl/iZKaQ5AcNq1ntgRVA",
  "33": "https://maps.app.goo.gl/iZKaQ5AcNq1ntgRVA",
}

export function getBranchGoogleMapsUrl(branch: {
  slug?: string
  id?: number | string
  latitude?: number | null
  longitude?: number | null
  address?: string
  name?: string
}): string {
  if (branch.slug && GOOGLE_MAPS_BRANCH_URLS[branch.slug.toLowerCase()]) {
    return GOOGLE_MAPS_BRANCH_URLS[branch.slug.toLowerCase()]
  }
  if (branch.id && GOOGLE_MAPS_BRANCH_URLS[String(branch.id)]) {
    return GOOGLE_MAPS_BRANCH_URLS[String(branch.id)]
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
    lat: 14.6641582,
    lng: -90.8454365,
    mapsUrl: GOOGLE_MAPS_BRANCH_URLS.central,
  },
  {
    id: "secundaria",
    name: "Panadería Secundaria",
    address: "Frente a Pradera Chimaltenango, Chimaltenango",
    phone: "",
    schedule: "Lunes a Sábado: 6:00 AM - 8:00 PM",
    lat: 14.6597067,
    lng: -90.8097663,
    mapsUrl: GOOGLE_MAPS_BRANCH_URLS.secundaria,
  },
]
