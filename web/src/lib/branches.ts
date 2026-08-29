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
