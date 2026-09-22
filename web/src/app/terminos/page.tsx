import Link from "next/link"
import { FileText, ShoppingBag, Banknote, Store, RotateCcw, Mail, ArrowLeft, Scale } from "lucide-react"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Términos y Condiciones | Panadería Svetlana",
  description: "Condiciones de uso, políticas de pedidos, pagos y retiro en sucursal en Panadería Svetlana.",
}

export default function TerminosPage() {
  return (
    <div className="bg-background text-foreground min-h-[70vh] py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header de la Página */}
        <div className="space-y-4 text-center sm:text-left">
          <Link href={ROUTES.home} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C522B] hover:text-[#D97706] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            <FileText className="h-3.5 w-3.5 text-[#A25514]" />
            Condiciones del Servicio
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-[#24140D]">
            Términos y Condiciones
          </h1>

          <p className="text-xs sm:text-sm text-[#8C522B] font-medium">
            Última actualización: <span className="font-bold text-[#24140D]">Septiembre 2026</span> · Chimaltenango, Guatemala
          </p>

          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-[#6E5545]">
            Bienvenido a Panadería Svetlana. Al acceder y realizar pedidos a través de nuestro sitio web o aplicación, aceptas los siguientes términos de servicio diseñados para garantizar la calidad de nuestros productos horneados y la satisfacción de nuestros clientes.
          </p>
        </div>

        {/* Secciones de Contenido */}
        <div className="grid gap-6">

          {/* 1. Uso de la plataforma */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">1. Uso de la plataforma</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              El uso de nuestra plataforma digital está destinado a clientes particulares y comerciales en Guatemala. El usuario se compromete a proporcionar información verídica al registrarse y realizar pedidos. Panadería Svetlana se reserva el derecho de actualizar o modificar estos términos cuando sea necesario para cumplir con regulaciones locales o mejoras operativas.
            </p>
          </div>

          {/* 2. Pedidos y Precios */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">2. Pedidos y Precios</h2>
            </div>
            <ul className="space-y-2 text-sm text-[#5C3D2E] list-disc list-inside ml-1">
              <li>Todos los precios se encuentran expresados en <strong className="text-[#24140D]">Quetzales (GTQ)</strong> e incluyen los impuestos de ley correspondientes.</li>
              <li>La disponibilidad de productos horneados a diario está sujeta a existencias en la sucursal seleccionada.</li>
              <li>Los tiempos de preparación y horneado son estimados y pueden variar según la demanda en horas pico.</li>
              <li>El pedido mínimo para reservar en línea es de <strong className="text-[#24140D]">Q15.00</strong>.</li>
            </ul>
          </div>

          {/* 3. Pagos */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Banknote className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">3. Método de Pago</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              El pago de los pedidos se realiza en <strong className="text-[#24140D]">efectivo directamente en caja</strong> al momento de retirar tus productos en la sucursal seleccionada. Te recomendamos tener el monto exacto o sencillo para agilizar tu entrega en tienda.
            </p>
          </div>

          {/* 4. Retiro en Sucursal */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Store className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">4. Retiro de Pedidos</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed mb-3">
              Todos los pedidos realizados a través de la web se recogen personalmente en la sucursal indicada al momento de confirmar la orden.
            </p>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              Para asegurar la frescura y textura de nuestro pan artesanal, solicitamos retirar el pedido dentro de la ventana de horario hábil del mismo día. Si no puedes acudir a tiempo, te pedimos comunicarte con la sucursal correspondiente.
            </p>
          </div>

          {/* 5. Devoluciones y Garantía de Calidad */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">5. Devoluciones y Reclamos</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              Por tratarse de productos alimenticios perecederos horneados frescos día con día, cualquier inconformidad o solicitud de reemplazo se evalúa de manera inmediata y presencial en la sucursal durante el mismo día de la compra, presentando el comprobante o número de orden. Nos comprometemos a garantizar tu total satisfacción con el sabor y calidad de nuestro pan.
            </p>
          </div>

          {/* 6. Contacto */}
          <div className="rounded-2xl border border-[#E8DCCB] bg-[#F7F1E8] p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-[#24140D]">
                <Mail className="h-4 w-4 text-[#D97706]" /> ¿Tienes alguna consulta sobre nuestros términos?
              </div>
              <p className="text-xs text-[#6E5545]">
                Escríbenos directamente o visita cualquiera de nuestras sucursales.
              </p>
            </div>
            <a href="mailto:panaderiasvetlana@gmail.com">
              <Button variant="outline" className="border-[#DECDBB] bg-white text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs h-10 rounded-xl px-4 shrink-0">
                Contactar Soporte
              </Button>
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}
