"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock3, Sparkles, Store, Wheat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export function HeroShowcase() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FAF7F2] to-[#F5EFE6] pt-6 sm:pt-10 lg:pt-14 pb-16 sm:pb-24 lg:pb-32">
      {/* Background Decorative Ambient Radial Glows */}
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-amber-200/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-0 top-20 h-[500px] w-[500px] rounded-full bg-amber-100/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-orange-100/30 blur-3xl" aria-hidden="true" />

      <div className="public-container relative z-10 grid gap-10 lg:grid-cols-[1fr_1.08fr] lg:items-center lg:gap-14">
        {/* Left Column: Value Proposition & CTAs */}
        <div className="animate-fade-up flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-900 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" aria-hidden="true" />
            <span>Panadería Tradicional · Chimaltenango</span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.5rem] xl:text-[4rem]">
            Un buen día empieza con{" "}
            <span className="relative inline-block text-primary">
              pan fresco.
              <svg className="absolute -bottom-1.5 left-0 w-full text-primary/30" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,5 Q50,0 100,5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Elaborado cada día con recetas tradicionales y el toque de siempre. Elige tus panes favoritos en línea y pasa a recogerlos calientitos a tu sucursal.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={ROUTES.products} className="w-full sm:w-auto">
              <Button size="lg" className="touch-tactile public-focus h-13 w-full rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-[0_12px_28px_-10px_rgba(217,119,6,0.55)] transition-all hover:bg-primary/90 hover:shadow-[0_16px_32px_-10px_rgba(217,119,6,0.65)] sm:w-auto">
                Ver catálogo completo
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="#como-comprar" className="public-focus inline-flex h-13 w-full items-center justify-center rounded-full border border-black/10 bg-white/80 px-7 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:bg-white sm:w-auto">
              Cómo comprar
            </Link>
          </div>

          {/* Key Guarantee Badges */}
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-black/5 pt-6 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground/80 sm:text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-primary">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </div>
              <span>2 hornadas diarias (5 AM & 2 PM)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground/80 sm:text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-primary">
                <Store className="h-4 w-4" aria-hidden="true" />
              </div>
              <span>Retiro en sucursal</span>
            </div>
            <div className="col-span-2 flex items-center gap-2.5 text-xs font-semibold text-foreground/80 sm:col-span-1 sm:text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-primary">
                <Wheat className="h-4 w-4" aria-hidden="true" />
              </div>
              <span>Ingredientes frescos y seleccionados</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Parallax Bakery Centerpiece */}
        <div className="relative flex items-center justify-center py-4 sm:py-8">
          {/* Outer Layer: Floating Wheat Stalks (Background Parallax) */}
          <div className="animate-float-reverse pointer-events-none absolute -left-4 -top-6 z-0 h-40 w-40 sm:-left-8 sm:-top-8 sm:h-56 sm:w-56 overflow-hidden rounded-full opacity-85 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]">
            <Image
              src="/images/floating-wheat.jpg"
              alt="Espigas de trigo dorado"
              fill
              sizes="(max-width: 640px) 160px, 224px"
              className="object-cover"
            />
          </div>

          {/* Outer Layer: Floating Mini Concha (Foreground Parallax) */}
          <div className="animate-float-slow pointer-events-none absolute -bottom-4 -right-2 z-20 h-36 w-36 sm:-bottom-6 sm:-right-4 sm:h-48 sm:w-48 overflow-hidden rounded-full opacity-90 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.2)]">
            <Image
              src="/images/floating-concha.jpg"
              alt="Pan dulce tradicional flotando"
              fill
              sizes="(max-width: 640px) 144px, 192px"
              className="object-cover"
            />
          </div>

          {/* Central Hero Piece: Concha on Ceramic Pedestal */}
          <div className="group relative z-10 w-full max-w-[460px] overflow-hidden rounded-[2.5rem] bg-white p-3.5 shadow-[0_32px_64px_-24px_rgba(40,20,5,0.18)] ring-1 ring-black/[0.04] transition-transform duration-700 hover:scale-[1.01] sm:p-5">
            {/* Header Tag inside the card */}
            <div className="flex items-center justify-between px-2 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/50">
              <span>Tradición Artesanal</span>
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Recién Salido del Horno
              </span>
            </div>

            {/* High-Resolution Hero Showcase Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#FFFDF8] to-[#FAF5EC]">
              <Image
                src="/images/hero-concha-pedestal.jpg"
                alt="Concha de pan dulce artesanal en pedestal recién horneada"
                fill
                priority
                sizes="(max-width: 640px) 90vw, 460px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />

              {/* Floating Quality Badge on the image */}
              <div className="absolute bottom-4 left-4 rounded-full border border-black/5 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm backdrop-blur-md">
                Concha Tradicional de Vainilla
              </div>
            </div>

            {/* Footer details inside the card */}
            <div className="mt-4 flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Horneado Diario</span>
              <span>Chimaltenango, Guatemala</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Organic Wave Transition connecting to the next section */}
      <div className="absolute -bottom-1 left-0 right-0 z-10 w-full overflow-hidden leading-none" aria-hidden="true">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative block h-10 w-full text-white sm:h-16 lg:h-20"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32 C280,72 560,8 840,40 C1120,72 1320,16 1440,32 L1440,80 L0,80 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}
