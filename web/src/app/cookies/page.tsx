import Link from "next/link"
import { Cookie, ShieldCheck, Sliders, Settings, Mail, ArrowLeft, CheckCircle2, Lock } from "lucide-react"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Política de Cookies | Panadería Svetlana",
  description: "Descubre cómo utilizamos las cookies para mejorar tu experiencia de compra y mantener tu sesión segura en Panadería Svetlana.",
}

export default function CookiesPage() {
  return (
    <div className="bg-background text-foreground min-h-[70vh] py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header de la Página */}
        <div className="space-y-4 text-center sm:text-left">
          <Link href={ROUTES.home} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C522B] hover:text-[#D97706] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            <Cookie className="h-3.5 w-3.5 text-[#A25514]" />
            Transparencia Digital
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-[#24140D]">
            Política de Cookies
          </h1>

          <p className="text-xs sm:text-sm text-[#8C522B] font-medium">
            Última actualización: <span className="font-bold text-[#24140D]">Septiembre 2026</span> · Chimaltenango, Guatemala
          </p>

          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-[#6E5545]">
            En Panadería Svetlana utilizamos cookies y tecnologías similares para garantizar que nuestra tienda web funcione con total seguridad, recordar tus preferencias de compra y brindarte una experiencia fluida al reservar tu pan fresco favorito.
          </p>
        </div>

        {/* Secciones de Contenido */}
        <div className="grid gap-6">

          {/* 1. ¿Qué son las cookies? */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Cookie className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">1. ¿Qué son las cookies?</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo (ordenador, tableta o teléfono móvil) cuando los visitas. Permiten que la plataforma reconozca tu navegador, mantenga abierta tu sesión de forma segura y recuerde datos útiles, como los artículos en tu carrito de compra o la sucursal que prefieres para retirar tus pedidos.
            </p>
          </div>

          {/* 2. Tipos de cookies que utilizamos */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Sliders className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">2. Tipos de cookies que utilizamos</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed mb-4">
              En nuestra tienda online clasificamos las cookies en las siguientes categorías según su finalidad:
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl bg-[#FAF5EE] border border-[#DECDBB]/60">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-[#D97706]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#24140D]">Esenciales</h3>
                </div>
                <p className="text-xs text-[#6E5545] leading-relaxed">
                  Estrictamente necesarias para navegar, autenticar tu cuenta de forma segura, procesar reservas en el carrito y prevenir fraudes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF5EE] border border-[#DECDBB]/60">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-[#D97706]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#24140D]">Preferencias</h3>
                </div>
                <p className="text-xs text-[#6E5545] leading-relaxed">
                  Recuerdan configuraciones personales, como tu sucursal de retiro seleccionada en Chimaltenango o tus filtros recientes del catálogo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF5EE] border border-[#DECDBB]/60">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-[#D97706]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#24140D]">Rendimiento</h3>
                </div>
                <p className="text-xs text-[#6E5545] leading-relaxed">
                  Nos ayudan a entender de forma agregada y 100% anónima qué productos son más consultados y cómo optimizar la velocidad del sistema.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Cookies de terceros y pasarelas */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">3. Cookies de terceros y seguridad</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed">
              Podemos utilizar servicios de terceros confiables para funciones técnicas esenciales, como la protección contra accesos automatizados no autorizados (hCaptcha) o el inicio de sesión simplificado (Google OAuth). Estos proveedores pueden colocar cookies propias para verificar la legitimidad de las solicitudes conforme a sus estándares de seguridad internacional.
            </p>
          </div>

          {/* 4. Cómo gestionar y deshabilitar las cookies */}
          <div className="rounded-2xl border border-[#DECDBB] bg-white p-6 shadow-xs hover:border-[#D97706]/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706]">
                <Settings className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">4. Cómo gestionar o deshabilitar las cookies</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed mb-3">
              Puedes configurar tu navegador web en cualquier momento para aceptar, bloquear o eliminar cookies. Consulta los pasos según el navegador que utilices:
            </p>
            <ul className="space-y-2 text-sm text-[#5C3D2E] list-disc list-inside ml-1">
              <li><strong className="text-[#24140D]">Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios.</li>
              <li><strong className="text-[#24140D]">Mozilla Firefox:</strong> Ajustes → Privacidad & Seguridad → Cookies y datos del sitio.</li>
              <li><strong className="text-[#24140D]">Apple Safari:</strong> Preferencias → Privacidad → Administrar datos de sitios web.</li>
              <li><strong className="text-[#24140D]">Microsoft Edge:</strong> Configuración → Permisos de cookies y sitios web.</li>
            </ul>
            <p className="text-xs text-[#8C522B] mt-4 font-medium italic">
              Nota importante: Si decides bloquear o eliminar las cookies esenciales, algunas funciones como mantener iniciada tu sesión o recordar los productos en tu carrito podrían no operar con normalidad.
            </p>
          </div>

          {/* 5. Contacto y Consultas */}
          <div className="rounded-2xl border border-[#DECDBB] bg-[#FAF5EE] p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B170F] text-[#F59E0B]">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#24140D]">5. Dudas sobre nuestra Política de Cookies</h2>
            </div>
            <p className="text-sm text-[#6E5545] leading-relaxed mb-4">
              Si tienes preguntas sobre cómo utilizamos las cookies o deseas más información sobre el tratamiento de tus datos, estamos a tu total disposición:
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="mailto:panaderiasvetlana@gmail.com">
                <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl text-xs h-10 px-5 shadow-xs">
                  <Mail className="h-4 w-4 mr-2" />
                  Escribir a panaderiasvetlana@gmail.com
                </Button>
              </a>
              <Link href={ROUTES.privacy}>
                <Button variant="outline" className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-xl text-xs h-10 font-bold">
                  Ver Política de Privacidad
                </Button>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
