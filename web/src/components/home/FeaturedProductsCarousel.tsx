"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from "lucide-react"
import { ProductCard } from "@/components/products/ProductCard"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"
import type { Product } from "@/types"

interface FeaturedProductsCarouselProps {
  products: Product[]
  isLoading?: boolean
  onAddToCart?: (productId: number) => void
}

export function FeaturedProductsCarousel({
  products,
  isLoading = false,
  onAddToCart,
}: FeaturedProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Extract unique categories from products
  const categories = [
    { id: "all", label: "Todos los favoritos" },
    ...Array.from(new Set(products.map((p) => p.category)))
      .filter(Boolean)
      .map((cat) => ({
        id: cat,
        label: cat.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
  ]

  // Filter products based on selected category
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory)

  // Update scroll navigation buttons state
  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    // Calculate approximate active card index
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).clientWidth + 16
      : 300
    const newIdx = Math.round(scrollLeft / cardWidth)
    setCurrentIndex(Math.min(newIdx, filteredProducts.length - 1))
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [filteredProducts])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).clientWidth + 16
      : 320
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth
    el.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).clientWidth + 16
      : 320
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" })
  }

  return (
    <section className="public-container py-14 sm:py-20">
      {/* Header with Title and Desktop Controls */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            Favoritos de la casa
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-[#24140D] sm:text-4xl">
            Lo que más se antoja
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6E5545] sm:text-base">
            Una selección curada con las recetas y especialidades más pedidas de Svetlana.
          </p>
        </div>

        {/* Action button & Carousel arrows */}
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.products}
            className="public-focus inline-flex items-center gap-2 rounded-full border border-[#DECDBB] bg-white px-4 py-2.5 text-xs font-bold text-[#8C522B] shadow-xs transition-all hover:border-[#D97706] hover:bg-[#FAF5EE] hover:text-[#D97706]"
          >
            Ver catálogo completo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>

          {/* Desktop Next/Prev Arrow Buttons */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Ver productos anteriores"
              className="public-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DECDBB] bg-white text-[#2B170F] shadow-xs transition-colors hover:border-[#D97706] hover:bg-[#FAF5EE] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Ver siguientes productos"
              className="public-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DECDBB] bg-white text-[#2B170F] shadow-xs transition-colors hover:border-[#D97706] hover:bg-[#FAF5EE] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills (if more than 1 category) */}
      {categories.length > 2 && (
        <div className="no-scrollbar mt-6 flex items-center gap-2 overflow-x-auto pb-2 pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id)
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({ left: 0, behavior: "smooth" })
                  }
                }}
                className={`public-focus shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#2B170F] text-white shadow-xs"
                    : "border border-[#DECDBB] bg-white text-[#6E5545] hover:border-[#D97706] hover:text-[#2B170F]"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Carousel Track */}
      <div className="relative mt-6">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden py-2" aria-label="Cargando productos destacados">
            {Array.from({ length: 4 }, (_, idx) => (
              <div
                key={idx}
                className="w-[270px] shrink-0 overflow-hidden rounded-3xl border border-border bg-card sm:w-[320px]"
              >
                <div className="aspect-[4/3] shimmer" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-3 w-1/2 rounded shimmer" />
                  <div className="h-10 rounded-xl shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-[#DECDBB] bg-[#FAF5EE] px-6 py-14 text-center">
            <ShoppingBag className="h-8 w-8 text-[#D97706]" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl font-bold text-[#24140D]">
              No hay productos en esta categoría
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6E5545]">
              Elige otra categoría o explora el catálogo completo para ver todas nuestras opciones.
            </p>
            <Button
              onClick={() => setSelectedCategory("all")}
              className="mt-6 rounded-full bg-primary px-6 font-bold text-white"
            >
              Ver todos los productos
            </Button>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-2 snap-x snap-mandatory scroll-smooth sm:mx-0 sm:px-0"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[260px] min-[400px]:w-[290px] sm:w-[310px] lg:w-[330px] shrink-0 snap-start"
                >
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </div>
              ))}
            </div>

            {/* Mobile / Visual Dots Progress Indicator */}
            {filteredProducts.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                {filteredProducts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToIndex(idx)}
                    aria-label={`Ir al producto ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? "w-7 bg-[#D97706]"
                        : "w-2 bg-[#DECDBB] hover:bg-[#A25514]"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
