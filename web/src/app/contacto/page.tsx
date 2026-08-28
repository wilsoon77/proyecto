"use client"

import { useState } from "react"
import { Clock3, HelpCircle, Mail, MapPin, Navigation, Send, Store } from "lucide-react"
import MultiBranchMap from "@/components/layout/MultiBranchMap"
import { STATIC_BRANCHES } from "@/lib/branches"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const fieldClass = "public-focus h-12 rounded-xl border-input bg-background text-sm placeholder:text-muted-foreground/80"

export default function ContactoPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)

    const targetEmail = "panaderiasvetlana@gmail.com"
    const mailSubject = encodeURIComponent(subject ? `[Panadería Svetlana] ${subject}` : "[Panadería Svetlana] Consulta desde la web")
    const mailBody = encodeURIComponent(
      `Hola Panadería Svetlana,\n\nMi nombre es: ${name}\nMi correo de contacto: ${email}\n\nMensaje:\n${message}\n\n---\nEnviado desde el sitio web`
    )

    const mailtoUrl = `mailto:${targetEmail}?subject=${mailSubject}&body=${mailBody}`
    window.location.href = mailtoUrl

    setTimeout(() => {
      setSending(false)
      setSent(true)
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
    }, 600)
  }

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <section className="public-container pb-12 pt-10 sm:pb-16 sm:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
          Atención y pedidos
        </div>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#24140D] sm:text-5xl">
          Estamos para ayudarte a planear tu próximo antojo.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#6E5545] sm:text-lg">
          Escríbenos para pedidos por mayor, cotizaciones para eventos o cualquier consulta sobre nuestras sucursales en Chimaltenango.
        </p>
      </section>

      {/* Main Grid: Channels & Form */}
      <section className="public-container grid gap-8 pb-16 sm:pb-24 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-12">
        <div className="space-y-4">
          {/* Channel 1: Email (Deep Espresso Card) */}
          <div className="rounded-3xl border border-[#42261B] bg-[#2B170F] p-6 text-[#FAF5EE] shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3D2317] text-[#F59E0B] mb-3">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F59E0B]">Correo electrónico</p>
            <a href="mailto:panaderiasvetlana@gmail.com" className="public-focus mt-2 block break-all font-display text-2xl font-bold text-white hover:text-[#F59E0B]">
              panaderiasvetlana@gmail.com
            </a>
            <p className="mt-2 text-xs leading-relaxed text-[#D2C3B4]">Respondemos consultas, cotizaciones para eventos y pedidos por mayor.</p>
          </div>

          {/* Channel 2: Schedule (Oat Card) */}
          <div className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8DAC9] text-[#A25514] mb-3">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Horarios de atención</p>
            <p className="mt-2 font-display text-xl font-bold text-[#2B170F]">Lunes a Sábado: 5:00 AM – 8:30 PM</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">2 hornadas diarias a las 5:00 AM y 2:00 PM para pan siempre fresco.</p>
          </div>

          {/* Channel 3: Locations (Amber Card) */}
          <div className="rounded-3xl border border-[#ECCDB5] bg-[#FAF0E6] p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F0DDCD] text-[#C85A17] mb-3">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9E4D1A]">Ubicaciones</p>
            <p className="mt-2 font-display text-xl font-bold text-[#2B170F]">2 Sucursales en Chimaltenango</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">Reserva en línea en cualquier momento y retira directamente en sucursal.</p>
          </div>

          {/* FAQ Accordion Box */}
          <div className="rounded-3xl border border-[#DECDBB] bg-[#F7F1E8] p-6 shadow-sm">
            <div className="flex gap-3">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold text-[#2B170F]">Preguntas frecuentes</h2>
                <div className="mt-3 space-y-2 text-xs">
                  <details className="group border-b border-[#E8DCCB] pb-2">
                    <summary className="cursor-pointer list-none font-semibold text-[#2B170F]">¿Cómo funciona el pedido en línea?</summary>
                    <p className="mt-2 leading-relaxed text-[#6E5545]">Elige productos en el catálogo, selecciona sucursal y retira sin hacer cola. Pagas en sucursal.</p>
                  </details>
                  <details className="group border-b border-[#E8DCCB] pb-2">
                    <summary className="cursor-pointer list-none font-semibold text-[#2B170F]">¿Con cuánto tiempo solicito un pedido especial o por mayor?</summary>
                    <p className="mt-2 leading-relaxed text-[#6E5545]">Para pedidos especiales de pan dulce, pan salado o eventos, recomendamos solicitarlo con 24 a 48 horas de anticipación.</p>
                  </details>
                  <details>
                    <summary className="cursor-pointer list-none font-semibold text-[#2B170F]">¿Hay pedido mínimo?</summary>
                    <p className="mt-2 leading-relaxed text-[#6E5545]">El pedido mínimo en línea es de Q15.00 para retiro en sucursal.</p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="rounded-3xl border border-[#DECDBB] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3 border-b border-[#EFE5D8] pb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706]">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[#24140D] sm:text-3xl">Envíanos un mensaje</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#6E5545]">Cuéntanos qué necesitas y nuestro equipo te responderá pronto por correo.</p>
            </div>
          </div>

          {sent ? (
            <div className="py-12 text-center">
              <Send className="mx-auto h-10 w-10 text-[#D97706]" aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl font-bold text-[#24140D]">¡Listo para enviar!</h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#6E5545]">Se ha preparado tu mensaje con los datos completados listo para enviar a <strong>panaderiasvetlana@gmail.com</strong> desde tu aplicación de correo.</p>
              <button type="button" onClick={() => setSent(false)} className="public-focus mt-6 rounded-full bg-[#D97706] hover:bg-[#B45309] px-6 py-2.5 text-sm font-bold text-white shadow-xs">
                Redactar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5 pt-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Nombre completo <span className="text-[#D97706]">*</span></label>
                <Input id="contact-name" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Correo electrónico <span className="text-[#D97706]">*</span></label>
                <Input id="contact-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" required className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-subject" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Asunto <span className="text-[#D97706]">*</span></label>
                <Input id="contact-subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Pedidos especiales, consultas..." required className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8C522B]">Mensaje <span className="text-[#D97706]">*</span></label>
                <textarea id="contact-message" name="message" value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="¿En qué podemos ayudarte?" className="public-focus min-h-[140px] w-full rounded-2xl border border-input bg-background p-4 text-sm text-[#24140D] placeholder:text-muted-foreground/80" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={sending} className="touch-tactile h-13 w-full rounded-full font-bold shadow-[0_8px_20px_-6px_rgba(217,119,6,0.5)] sm:w-auto sm:px-8">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {sending ? "Enviando..." : "Enviar mensaje"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Branches Section */}
      <section className="border-y border-[#E8DCCB] bg-[#F7F1E8] py-16 sm:py-24">
        <div className="public-container">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
              Sucursales
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-[#24140D] sm:text-4xl">
              Pasa por pan recién horneado.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6E5545] sm:text-base">
              Tenemos dos ubicaciones en Chimaltenango para que recoger tu pedido sea cómodo y rápido.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {STATIC_BRANCHES.map((branch) => (
              <div key={branch.id} className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[#2B170F]">{branch.name}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#D97706]">Chimaltenango</p>
                  </div>
                  <Store className="h-6 w-6 text-[#D97706]" aria-hidden="true" />
                </div>
                <div className="mt-6 grid gap-2.5 text-xs text-[#5C3D2E]">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                    {branch.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                    {branch.schedule}
                  </p>
                </div>
                <a href={branch.mapsUrl} target="_blank" rel="noreferrer" className="public-focus mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#D97706] hover:text-[#A25514]">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Abrir en Google Maps
                </a>
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border border-[#DECDBB] bg-white p-3 shadow-sm">
            <MultiBranchMap />
          </div>
        </div>
      </section>
    </div>
  )
}
