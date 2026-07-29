import Link from "next/link"
import Image from "next/image"
import { Notebook as Facebook, Drama as Instagram, Battery as Twitter, Mail, Phone, MapPin, Apple, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream">
      {/* Newsletter Section */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Suscríbete a nuestro Newsletter
              </h3>
              <p className="mt-2 text-muted-foreground">
                Recibe promociones exclusivas y novedades directamente en tu correo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              <Button size="lg" className="shadow-warm">Suscribirme</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="flex items-center">
              <Image 
                src="/images/logo-panaderia.png" 
                alt="Panaderia Svetlana" 
                width={120} 
                height={48}
                className="h-12 w-auto object-contain rounded-lg"
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Sistema inteligente de gestión para panaderías en Guatemala. 
              Pan fresco, calidad garantizada.
            </p>
            
            {/* Social Media */}
            <div className="mt-6 flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-muted-foreground transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-muted-foreground transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-muted-foreground transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>

            {/* App badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary">
                <Apple className="h-4 w-4" />
                <span>App Store</span>
              </a>
              <a href="#" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary">
                <Play className="h-4 w-4" />
                <span>Google Play</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={ROUTES.products} className="text-muted-foreground transition-colors hover:text-primary">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/promociones" className="text-muted-foreground transition-colors hover:text-primary">
                  Promociones
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="text-muted-foreground transition-colors hover:text-primary">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href={ROUTES.contact} className="text-muted-foreground transition-colors hover:text-primary">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href={ROUTES.branches} className="text-muted-foreground transition-colors hover:text-primary">
                  Nuestras Sucursales
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Atención al Cliente
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/sucursales" className="text-muted-foreground transition-colors hover:text-primary">
                  Sucursales y Retiro
                </Link>
              </li>
              <li>
                <Link href={ROUTES.orders} className="text-muted-foreground transition-colors hover:text-primary">
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <Link href={ROUTES.contact} className="text-muted-foreground transition-colors hover:text-primary">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
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
                <a href="tel:+50212345678" className="hover:text-primary transition-colors">
                  +502 1234-5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:info@panaderia.gt" className="hover:text-primary transition-colors">
                  info@panaderia.gt
                </a>
              </li>
            </ul>

            {/* Horarios */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground">HORARIOS</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} Panaderia Svetlana Smart System. 
              Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="/privacidad" className="hover:text-primary transition-colors">
                Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-primary transition-colors">
                Términos
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
