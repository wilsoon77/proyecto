"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, MessageCircle } from "lucide-react"

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Contacto</h1>
      <p className="mb-8 text-gray-600">Estamos para ayudarte. Escríbenos por el formulario o por WhatsApp.</p>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Información de contacto */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-3 text-xl font-semibold">Datos</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Zona 10, Guatemala City, Guatemala</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="tel:+50212345678" className="hover:text-primary">+502 1234-5678</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:info@panaderia.gt" className="hover:text-primary">info@panaderia.gt</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="https://wa.me/50212345678" target="_blank" className="hover:text-primary" rel="noreferrer">WhatsApp</a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white"><Facebook className="h-4 w-4" /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white"><Instagram className="h-4 w-4" /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white"><Twitter className="h-4 w-4" /></a>
            </div>
          </div>

          {/* FAQs */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-3 text-xl font-semibold">Preguntas Frecuentes</h2>
            <div className="space-y-3">
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer font-medium">¿Hacen envíos a toda la ciudad?</summary>
                <p className="mt-2 text-sm text-gray-700">Sí, realizamos entregas en la Ciudad de Guatemala. Envío gratis desde Q100.</p>
              </details>
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer font-medium">¿Con cuánta anticipación pido un pastel?</summary>
                <p className="mt-2 text-sm text-gray-700">Idealmente 24-48 horas antes para personalizaciones.</p>
              </details>
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer font-medium">¿Qué métodos de pago aceptan?</summary>
                <p className="mt-2 text-sm text-gray-700">Efectivo, transferencia y tarjeta (en entrega o en tienda).</p>
              </details>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Escríbenos</h2>
            {sent ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                ¡Gracias! Hemos recibido tu mensaje y te contactaremos pronto.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium">Nombre</label>
                  <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" required />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium">Correo</label>
                  <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" required />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium">Teléfono</label>
                  <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium">Asunto</label>
                  <Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Mensaje</label>
                  <textarea
                    value={message}
                    onChange={e=>setMessage(e.target.value)}
                    required
                    placeholder="¿Cómo podemos ayudarte?"
                    className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={sending}>
                    {sending ? 'Enviando…' : 'Enviar mensaje'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
