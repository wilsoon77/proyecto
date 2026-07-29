"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  MessageCircle, 
  Navigation, 
  Store,
  Clock
} from "lucide-react"
import MultiBranchMap, { STATIC_BRANCHES } from "@/components/layout/MultiBranchMap"

export default function ContactoPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSending(false)
    setSent(true)
    setName("")
    setEmail("")
    setPhone("")
    setSubject("")
    setMessage("")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Encabezado */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Contacto y Ubicaciones</h1>
        <p className="text-gray-600">Estamos para ayudarte. Visita nuestras sucursales o escríbenos mediante el formulario.</p>
      </div>

      {/* Grid Principal: Info + Formulario */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Información de contacto general */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Canales Directos</h2>
            <ul className="space-y-3.5 text-sm text-gray-700">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Teléfono Central</p>
                  <a href="tel:+50212345678" className="hover:text-amber-600 font-semibold text-gray-900">+502 1234-5678</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Correo Electrónico</p>
                  <a href="mailto:info@panaderia.gt" className="hover:text-amber-600 font-semibold text-gray-900">info@panaderia.gt</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">WhatsApp Pedidos</p>
                  <a href="https://wa.me/50212345678" target="_blank" className="hover:text-amber-600 font-semibold text-gray-900" rel="noreferrer">
                    +502 1234-5678
                  </a>
                </div>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-amber-600 hover:text-white">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-amber-600 hover:text-white">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-amber-600 hover:text-white">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* FAQs */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">Preguntas Frecuentes</h2>
            <div className="space-y-3">
              <details className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                <summary className="cursor-pointer font-medium text-sm text-gray-900">¿Cómo funciona el pedido en línea?</summary>
                <p className="mt-2 text-xs text-gray-600">Eliges tus productos en la web, seleccionas la sucursal de tu preferencia y los recoges. El pago se realiza al momento de la entrega.</p>
              </details>
              <details className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                <summary className="cursor-pointer font-medium text-sm text-gray-900">¿Con cuánto tiempo pido un pastel?</summary>
                <p className="mt-2 text-xs text-gray-600">Idealmente con 24 a 48 horas de anticipación para pedidos personalizados.</p>
              </details>
              <details className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                <summary className="cursor-pointer font-medium text-sm text-gray-900">¿Cuál es el pedido mínimo?</summary>
                <p className="mt-2 text-xs text-gray-600">El pedido mínimo es de Q15. Puedes pagar en efectivo o tarjeta de crédito/débito al recoger.</p>
              </details>
            </div>
          </div>
        </div>

        {/* Formulario de Mensaje */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Escríbenos un Mensaje</h2>
            {sent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm font-medium">
                ¡Gracias! Hemos recibido tu mensaje y nuestro equipo te contactará pronto.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" required />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Correo Electrónico</label>
                  <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" required />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
                  <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Asunto</label>
                  <Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Ej: Pedidos especiales, eventos" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    value={message}
                    onChange={e=>setMessage(e.target.value)}
                    required
                    placeholder="¿En qué podemos ayudarte?"
                    className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                    {sending ? 'Enviando…' : 'Enviar mensaje'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Direcciones de Sucursales + Mapa Unificado de 2 Marcadores */}
      <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-amber-600" />
            Nuestras Sucursales
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Visítanos en cualquiera de nuestras dos direcciones. Ambos marcadores están resaltados en el mapa a continuación.
          </p>
        </div>

        {/* Tarjetas Estáticas de las 2 Sucursales */}
        <div className="grid gap-6 md:grid-cols-2">
          {STATIC_BRANCHES.map((b) => (
            <div key={b.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-3 hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                <h3 className="text-lg font-bold text-gray-900">{b.name}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                  <MapPin className="h-3 w-3" /> Guatemala
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="font-medium text-gray-800">{b.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                  <a href={`tel:${b.phone.replace(/[^\d+]/g, '')}`} className="hover:text-amber-600 font-medium">
                    {b.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{b.schedule}</span>
                </p>
              </div>

              <div className="pt-2">
                <a 
                  href={b.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Abrir en Google Maps
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Mapa Interactivo con 2 Marcadores */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Mapa de Ubicaciones Simultáneas</h3>
          <MultiBranchMap />
        </div>
      </div>
    </div>
  )
}
