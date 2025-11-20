import Link from "next/link"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Apple, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      {/* Newsletter Section */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Suscríbete a nuestro Newsletter
              </h3>
              <p className="mt-2 text-gray-600">
                Recibe promociones exclusivas y novedades directamente en tu correo.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="h-11 flex-1 rounded-md border border-gray-300 px-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button size="lg">Suscribirme</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🥖</span>
              <div>
                <span className="text-xl font-bold text-gray-900">PanaderIA</span>
                <p className="text-xs text-gray-600">Smart System</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Sistema inteligente de gestión para panaderías en Guatemala. 
              Pan fresco, calidad garantizada.
            </p>
            
            {/* Social Media */}
            <div className="mt-6 flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>

            {/* App badges (placeholder) */}
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-gray-700 hover:border-primary hover:text-primary">
                <Apple className="h-4 w-4" />
                <span>App Store</span>
              </a>
              <a href="#" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-gray-700 hover:border-primary hover:text-primary">
                <Play className="h-4 w-4" />
                <span>Google Play</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={ROUTES.products}
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Productos
                </Link>
              </li>
              <li>
                <Link
                  href="/promociones"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Promociones
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.contact}
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.branches}
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Nuestras Sucursales
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Atención al Cliente
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/ayuda"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link
                  href="/envios"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Información de Envíos
                </Link>
              </li>
              <li>
                <Link
                  href="/devoluciones"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.orders}
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  Zona 10, Guatemala City
                  <br />
                  Guatemala
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="tel:+50212345678" className="hover:text-primary">
                  +502 1234-5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:info@panaderia.gt" className="hover:text-primary">
                  info@panaderia.gt
                </a>
              </li>
            </ul>

            {/* Horarios */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-900">HORARIOS</p>
              <p className="mt-1 text-sm text-gray-600">
                Lun - Vie: 6:00 AM - 8:00 PM
                <br />
                Sábados: 7:00 AM - 9:00 PM
                <br />
                Domingos: 7:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} PanaderIA Smart System. 
              Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="/privacidad" className="hover:text-primary">
                Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-primary">
                Términos
              </Link>
              <Link href="/cookies" className="hover:text-primary">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
