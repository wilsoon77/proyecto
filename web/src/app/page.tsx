"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  ShieldCheck,
  ShoppingBag,
  Store,
  Wheat,
} from "lucide-react"
import { ProductCard } from "@/components/products/ProductCard"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { useSystemConfig } from "@/context/SystemConfigContext"
import { productsService } from "@/lib/api"
import { apiProductToProduct } from "@/lib/api/transformers"
import { ROUTES } from "@/lib/constants"
import { defaultSalePresentation } from "@/lib/presentation-quantities"
import type { Product } from "@/types"

import { HeroShowcase } from "@/components/home/HeroShowcase"
import { ProcessScrollStory } from "@/components/home/ProcessScrollStory"
import { ArtisanMarquee } from "@/components/home/ArtisanMarquee"
import { FeaturedProductsCarousel } from "@/components/home/FeaturedProductsCarousel"

export default function Home() {
  const router = useRouter()
  const { addItem } = useCart()
  const { canPurchase, isCatalogOnly, isLoading: isConfigLoading } = useSystemConfig()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes("type=recovery")) {
      router.replace(`/reset-password${hash}`)
    }
  }, [router])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const branch = localStorage.getItem("selectedBranch")
        const response = await productsService.featured(8, branch || undefined)
        setFeaturedProducts(response.map(apiProductToProduct))
      } catch (error) {
        console.error("Error cargando productos destacados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  return (
    <div className="bg-background text-foreground">
      {/* 3D Parallax & Food Styling Hero Section */}
      <HeroShowcase />

      {/* Interactive 60fps Scrollytelling: The Artisan Bread-Making Process */}
      <ProcessScrollStory />

      {/* 3 Bento Cards: Guarantees & Values */}
      <section className="border-y border-[#E8DCCB] bg-[#F7F1E8] py-10 sm:py-14">
        <div className="public-container">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {/* Card 1: Oat Cream */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8DAC9] text-[#A25514] mb-4">
                <CalendarCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C522B]">Planifica tu día</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-[#2B170F]">Reserva sin filas</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C3D2E]">Aparta tus favoritos en línea antes de salir y encuéntralos listos.</p>
            </div>

            {/* Card 2: Featured Deep Espresso */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#42261B] bg-[#2B170F] p-6 text-[#FAF5EE] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute right-4 top-4 rounded-full bg-[#D97706]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                Fácil y rápido
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D2317] text-[#F59E0B] mb-4">
                <Store className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D49E6E]">2 Sucursales</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-white">Retiro sencillo</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#D2C3B4]">Elige tu sucursal más cercana en Chimaltenango y pasa a recoger.</p>
            </div>

            {/* Card 3: Warm Amber Oat */}
            <div className="group relative overflow-hidden rounded-3xl border border-[#ECCDB5] bg-[#FAF0E6] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0DDCD] text-[#C85A17] mb-4">
                <Wheat className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E4D1A]">Horneado Diario</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-[#2B170F]">Hecho cada día</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C3D2E]">2 hornadas diarias (5 AM y 2 PM) para disfrutar tu pan calientito.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Artisan Badges & Brands Marquee */}
      <ArtisanMarquee
        kicker="Nuestros Compromisos"
        title="Dedicación y esmero en cada horneada"
        className="border-y border-[#DECDBB] bg-[#F3E9DC]"
      />

      {!isConfigLoading && isCatalogOnly && (
        <div role="status" className="public-container pt-8">
          <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
            Catálogo informativo: consulta nuestros productos y precios; las compras están deshabilitadas temporalmente.
          </div>
        </div>
      )}

      {/* House Favorites: Curated Interactive Carousel */}
      <FeaturedProductsCarousel
        products={featuredProducts}
        isLoading={isLoading}
        onAddToCart={canPurchase ? (productId) => {
          const selected = featuredProducts.find((item) => item.id === productId)
          if (selected) addItem(selected, 1, defaultSalePresentation(selected))
        } : undefined}
      />

      {/* How to Buy Bento Grid */}
      <section id="como-comprar" className="border-y border-[#E8DCCB] bg-[#F7F1E8] py-16 sm:py-24">
        <div className="public-container">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
                Cómo comprar
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.035em] text-[#24140D] sm:text-4xl">Tu pedido listo cuando llegues.</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6E5545] sm:text-base">El proceso es simple: eliges en línea, reservas tu horario y recoges recién salido del horno. El pago se realiza en la sucursal.</p>
              <Link href={ROUTES.products} className="public-focus mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90">
                Empezar pedido <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* 3 Step Bento Cards with Alternating Colors */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Step 1: Oat Card */}
              <div className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
                <span className="font-display text-4xl font-bold text-[#8C522B]">01</span>
                <h3 className="mt-4 text-base font-bold text-[#2B170F]">Elige</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">Explora el catálogo y elige tus piezas favoritas de pan dulce y tradicional.</p>
              </div>

              {/* Step 2: Featured Dark Espresso Card */}
              <div className="rounded-3xl border border-[#42261B] bg-[#2B170F] p-6 text-[#FAF5EE] shadow-lg">
                <span className="font-display text-4xl font-bold text-[#F59E0B]">02</span>
                <h3 className="mt-4 text-base font-bold text-white">Reserva</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#D2C3B4]">Confirma la sucursal de retiro y el horario más conveniente para ti.</p>
              </div>

              {/* Step 3: Warm Amber Card */}
              <div className="rounded-3xl border border-[#ECCDB5] bg-[#FAF0E6] p-6 shadow-sm">
                <span className="font-display text-4xl font-bold text-[#C85A17]">03</span>
                <h3 className="mt-4 text-base font-bold text-[#2B170F]">Recoge</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">Llega al mostrador, abona tu pedido y disfruta pan recién horneado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Deep Espresso Callout Banner */}
      <section className="public-container py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#44281B] bg-[#24130B] px-6 py-12 text-[#FAF5EE] shadow-2xl sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Garantía de Frescura</span>
            </div>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              Pan fresco para compartir, sin complicar tu día.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#D6C4B4] sm:text-base">
              Reserva en línea con anticipación y encuentra tu pedido empacado y esperándote en la sucursal que prefieras de Chimaltenango.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTES.products}
                className="public-focus inline-flex h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground shadow-[0_12px_24px_-8px_rgba(217,119,6,0.6)] transition-all hover:bg-primary/90"
              >
                Ver productos disponibles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={ROUTES.about}
                className="public-focus inline-flex h-13 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Conoce nuestra historia
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
