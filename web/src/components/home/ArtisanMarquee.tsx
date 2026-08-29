"use client"

import {
  Award,
  Clock3,
  Coffee,
  Flame,
  HeartHandshake,
  Leaf,
  Milk,
  ShieldCheck,
  Sparkles,
  Wheat,
} from "lucide-react"

export interface MarqueeItem {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  tag?: string
}

const DEFAULT_MARQUEE_ITEMS: MarqueeItem[] = [
  {
    icon: Wheat,
    title: "Harinas 100% Seleccionadas",
    subtitle: "Trigo puro de molienda fina",
    tag: "Calidad",
  },
  {
    icon: Clock3,
    title: "Fermentación Lenta 24 Horas",
    subtitle: "Digestión ligera y aroma profundo",
    tag: "Proceso",
  },
  {
    icon: Flame,
    title: "2 Hornadas Diarias",
    subtitle: "5:00 AM y 2:00 PM pan caliente",
    tag: "Frescura",
  },
  {
    icon: Sparkles,
    title: "Masa Madre Centenaria",
    subtitle: "Cultivo vivo natural sin aditivos",
    tag: "Tradición",
  },
  {
    icon: Milk,
    title: "Mantequilla Pura de Campo",
    subtitle: "Cremosa y sin grasas trans",
    tag: "Ingrediente",
  },
  {
    icon: Award,
    title: "Recetas Familiares",
    subtitle: "Elaboración artesanal de verdad",
    tag: "Origen",
  },
  {
    icon: Coffee,
    title: "Café de Altura Tostado",
    subtitle: "El compañero perfecto para tu pan",
    tag: "Cafetería",
  },
  {
    icon: HeartHandshake,
    title: "Productores Locales",
    subtitle: "Compromiso con Chimaltenango",
    tag: "Comunidad",
  },
  {
    icon: ShieldCheck,
    title: "Sin Conservantes Químicos",
    subtitle: "Solo ingredientes 100% limpios",
    tag: "Natural",
  },
  {
    icon: Leaf,
    title: "Empaque Biodegradable",
    subtitle: "Cuidado de nuestra tierra",
    tag: "Eco",
  },
]

interface ArtisanMarqueeProps {
  items?: MarqueeItem[]
  title?: string
  kicker?: string
  reverse?: boolean
  className?: string
}

export function ArtisanMarquee({
  items = DEFAULT_MARQUEE_ITEMS,
  title,
  kicker,
  reverse = false,
  className = "",
}: ArtisanMarqueeProps) {
  const animationClass = reverse ? "animate-marquee-scroll-reverse" : "animate-marquee-scroll"

  const renderBadge = (item: MarqueeItem, idx: number) => {
    const Icon = item.icon
    return (
      <div
        key={idx}
        className="flex shrink-0 items-center gap-4 rounded-3xl border border-[#DECDBB] bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D97706] hover:shadow-md sm:gap-5 sm:px-7 sm:py-5"
      >
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] shadow-xs">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm font-bold text-[#2B170F] sm:text-base">
              {item.title}
            </p>
            {item.tag && (
              <span className="hidden sm:inline-block rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9E4D1A]">
                {item.tag}
              </span>
            )}
          </div>
          <p className="mt-0.5 whitespace-nowrap text-xs text-[#6E5545] sm:text-sm">
            {item.subtitle}
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className={`relative overflow-hidden py-10 sm:py-16 ${className}`}>
      {(kicker || title) && (
        <div className="public-container mb-8 text-center">
          {kicker && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D49E6E]/60 bg-[#E8DAC9] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#7E3D0A]">
              {kicker}
            </span>
          )}
          {title && (
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#2B170F] sm:text-4xl">
              {title}
            </h3>
          )}
        </div>
      )}

      {/* Track wrapper with gradient fade masks */}
      <div className="group relative flex w-full overflow-hidden select-none">
        {/* Left and Right Fade Gradients */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-36 bg-gradient-to-r from-[#F3E9DC] via-[#F3E9DC]/80 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-36 bg-gradient-to-l from-[#F3E9DC] via-[#F3E9DC]/80 to-transparent"
          aria-hidden="true"
        />

        {/* Track 1 */}
        <div className={`flex shrink-0 ${animationClass} items-center gap-4 pr-4 sm:gap-5 sm:pr-5`}>
          {items.map((item, idx) => renderBadge(item, idx))}
        </div>

        {/* Track 2 (Duplicate for continuous loop) */}
        <div
          aria-hidden="true"
          className={`flex shrink-0 ${animationClass} items-center gap-4 pr-4 sm:gap-5 sm:pr-5`}
        >
          {items.map((item, idx) => renderBadge(item, idx + items.length))}
        </div>
      </div>
    </section>
  )
}
