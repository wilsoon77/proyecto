import Image from "next/image"
import Link from "next/link"
import { Clock3, Mail, MapPin } from "lucide-react"
import { ROUTES } from "@/lib/constants"

const footerLinks = [
  { label: "Productos", href: ROUTES.products },
  { label: "Sobre nosotros", href: ROUTES.about },
  { label: "Sucursales", href: ROUTES.branches },
  { label: "Contacto", href: ROUTES.contact },
]

export function Footer() {
  return (
    <footer className="border-t border-[#E8DCCB] bg-[#FAF5EE] text-[#2B170F]">
      <div className="public-container py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.8fr_1.2fr] lg:gap-10">
          <div>
            <Link href={ROUTES.home} className="public-focus relative block h-16 w-56 sm:h-20 sm:w-72">
              <Image
                src="/images/logo-panaderia.svg"
                alt="Panadería Svetlana"
                fill
                sizes="(max-width: 640px) 224px, 288px"
                className="object-contain object-left mix-blend-multiply"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#6E5545]">
              Pan fresco y repostería artesanal para compartir en Chimaltenango. Reserva en línea y recoge recién salido del horno.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8C522B]">Explora</p>
            <nav aria-label="Enlaces del pie de página" className="grid gap-3 text-sm">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="public-focus w-fit text-[#5C3D2E] transition-colors hover:text-[#D97706]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8C522B]">Atención</p>
            <nav aria-label="Ayuda y pedidos" className="grid gap-3 text-sm">
              <Link href={ROUTES.orders} className="public-focus w-fit text-[#5C3D2E] transition-colors hover:text-[#D97706]">Mis pedidos</Link>
              <Link href={ROUTES.profile} className="public-focus w-fit text-[#5C3D2E] transition-colors hover:text-[#D97706]">Mi cuenta</Link>
              <Link href={ROUTES.privacy} className="public-focus w-fit text-[#5C3D2E] transition-colors hover:text-[#D97706]">Privacidad</Link>
              <Link href={ROUTES.terms} className="public-focus w-fit text-[#5C3D2E] transition-colors hover:text-[#D97706]">Términos</Link>
            </nav>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8C522B]">Encuéntranos</p>
            <div className="grid gap-3 text-sm text-[#5C3D2E]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                <span>Chimaltenango, Guatemala</span>
              </div>
              <a href="mailto:panaderiasvetlana@gmail.com" className="public-focus flex items-center gap-3 transition-colors hover:text-[#D97706]">
                <Mail className="h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                panaderiasvetlana@gmail.com
              </a>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                <span>Lunes a sábado, 5:00 AM – 8:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8DCCB] bg-[#F3E9DC]">
        <div className="public-container flex flex-col gap-3 py-5 text-xs text-[#8C522B] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Panadería Svetlana. Todos los derechos reservados.</p>
          <Link href={ROUTES.contact} className="public-focus inline-flex items-center gap-2 font-semibold text-[#2B170F] transition-colors hover:text-[#D97706]">
            ¿Necesitas ayuda con tu pedido?
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
