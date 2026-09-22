import Link from "next/link"
import { ShieldCheck, Database, Sliders, Lock, UserCheck, Cookie, Mail, ArrowLeft } from "lucide-react"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Política de Privacidad | Panadería Svetlana",
  description: "Conoce cómo recopilamos, protegemos y utilizamos tus datos personales en Panadería Svetlana.",
}

export default function PrivacidadPage() {
  return (
    <div className="bg-background text-foreground min-h-[70vh] py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header de la Página */}
        <div className="space-y-4 text-center sm:text-left">
          <Link href={ROUTES.home} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C522B] hover:text-[#D97706] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            <ShieldCheck className="h-3.5 w-3.5 text-[#A25514]" />
            Legal & Privacidad
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-[#24140D]">
            Política de Privacidad
          </h1>

          <p className="text-xs sm:text-sm text-[#8C522B] font-medium">
            Última actualización: <span className="font-bold text-[#24140D]">Septiembre 2026</span> · Chimaltenango, Guatemala
          </p>

          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-[#6E5545]">
            En Panadería Svetlana valoramos y respetamos tu privacidad. Esta política describe con total transparencia qué datos recopilamos cuando navegas o realizas pedidos en nuestra plataforma, cómo los protegemos y cómo puedes ejercer tus derechos como usuario.
          </p>
        </div>

        {/* Secciones de Contenido */}
        <div className="grid gap-6">

          {/* 1. Datos que recopilamos */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">1. Datos que recopilamos</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed mb-3">
              Únicamente recopilamos la información estrictamente necesaria para prestarte un servicio de panadería rápido y confiable:
            </p>
            <ul className="space-y-2 text-sm text-[#5C3D2E] list-disc list-inside ml-1">
              <li><strong className="text-[#24140D]">Datos de contacto:</strong> Nombre, apellido, número de teléfono y correo electrónico al registrarte o procesar tu orden.</li>
              <li><strong className="text-[#24140D]">Detalles de pedidos:</strong> Selección de productos, presentaciones, notas especiales y sucursal de retiro seleccionada.</li>
              <li><strong className="text-[#24140D]">Datos técnicos de uso:</strong> Páginas visitadas, preferencias de navegación y analíticas anónimas para optimizar la velocidad del sitio.</li>
            </ul>
          </div>

          {/* 2. Cómo usamos tus datos */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Sliders className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">2. Cómo usamos tus datos</h2>
            </div>
            <ul className="space-y-2 text-sm text-[#5C3D2E] list-disc list-inside ml-1">
              <li>Procesar, preparar y coordinar tus pedidos para retiro puntual en la sucursal de tu elección.</li>
              <li>Enviarte confirmaciones y actualizaciones sobre el estado de tu pedido (vía web o notificaciones Push si las activas).</li>
              <li>Comunicar promociones especiales de temporada o nuevos productos horneados (únicamente si nos diste tu consentimiento previo).</li>
              <li>Mejorar continuamente nuestra plataforma digital y la experiencia de atención al cliente.</li>
            </ul>
          </div>

          {/* 3. Conservación y seguridad */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">3. Conservación y seguridad</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              Tus datos son almacenados en infraestructuras con cifrado y medidas de seguridad técnicas y organizativas adecuadas. No vendemos, alquilamos ni transferimos tus datos personales a terceros con fines publicitarios. Conservamos la información únicamente el tiempo necesario para el cumplimiento de las finalidades comerciales y legales aplicables.
            </p>
          </div>

          {/* 4. Tus derechos */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">4. Tus derechos</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed mb-3">
              Como usuario de Panadería Svetlana, tienes el derecho de acceder, rectificar o solicitar la eliminación definitiva de tus datos personales de nuestros registros en cualquier momento.
            </p>
            <p className="text-sm text-[#6E5545]">
              Para ejercer cualquiera de estos derechos, basta con enviar una solicitud a nuestro correo de contacto oficial:{" "}
              <a href="mailto:panaderiasvetlana@gmail.com" className="font-bold text-[#D97706] hover:underline">
                panaderiasvetlana@gmail.com
              </a>.
            </p>
          </div>

          {/* 5. Cookies y tecnologías similares */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Cookie className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">5. Cookies</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              Utilizamos cookies técnicas necesarias para recordar tu sesión, mantener tu carrito de compras activo y brindarte una navegación fluida. Puedes revisar los detalles y gestionar tus preferencias en nuestra{" "}
              <Link href={ROUTES.cookies} className="font-bold text-[#D97706] hover:underline">
                Política de Cookies
              </Link>.
            </p>
          </div>

          {/* 6. Contacto */}
          <div className="rounded-2xl border border-[#E8DCCB] bg-[#F7F1E8] p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-[#24140D]">
                <Mail className="h-4 w-4 text-[#D97706]" /> ¿Tienes alguna duda sobre tu privacidad?
              </div>
              <p className="text-xs text-[#6E5545]">
                Nuestro equipo está disponible para ayudarte a resolver cualquier inquietud.
              </p>
            </div>
            <a href="mailto:panaderiasvetlana@gmail.com">
              <Button variant="outline" className="border-[#DECDBB] bg-white text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs h-10 rounded-xl px-4 shrink-0">
                Escribir a Soporte
              </Button>
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}
