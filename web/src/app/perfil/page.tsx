"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PerfilPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [municipality, setMunicipality] = useState("")
  const [zone, setZone] = useState("")
  const [address, setAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('profile')
      if (raw) {
        const p = JSON.parse(raw)
        setFirstName(p.firstName ?? "")
        setLastName(p.lastName ?? "")
        setEmail(p.email ?? "")
        setPhone(p.phone ?? "")
        setDepartment(p.department ?? "")
        setMunicipality(p.municipality ?? "")
        setZone(p.zone ?? "")
        setAddress(p.address ?? "")
      }
    } catch {}
  }, [])

  const save = async () => {
    setSaving(true)
    const data = { firstName, lastName, email, phone, department, municipality, zone, address }
    try { localStorage.setItem('profile', JSON.stringify(data)) } catch {}
    // Opcional: también prellenar checkout
    try {
      const checkout = {
        fullName: `${firstName} ${lastName}`.trim(),
        phone,
        department,
        municipality,
        zone,
        address,
        reference: "",
      }
      localStorage.setItem('checkoutCustomer', JSON.stringify(checkout))
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">Mi Perfil</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Información personal</h2>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <Input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Juan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Apellido</label>
              <Input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Pérez" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Correo</label>
              <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="juan@correo.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="5555-5555" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Dirección</h2>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Departamento</label>
              <Input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Guatemala" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Municipio</label>
              <Input value={municipality} onChange={e=>setMunicipality(e.target.value)} placeholder="Guatemala" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Zona</label>
              <Input value={zone} onChange={e=>setZone(e.target.value)} placeholder="Zona 1" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dirección</label>
              <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Calle, No., colonia" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
        {saved && <span className="text-sm text-emerald-700">Cambios guardados</span>}
      </div>
    </div>
  )
}
