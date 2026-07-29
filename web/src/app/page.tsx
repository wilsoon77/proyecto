"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { useCart } from "@/context/CartContext"
import { productsService } from "@/lib/api"
import { apiProductToProduct } from "@/lib/api/transformers"
import type { Product } from "@/types"
import { ProductCard } from "@/components/products/ProductCard"
import { Calendar, Store, Wheat } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      router.replace(`/reset-password${hash}`)
    }
  }, [router])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const branch = typeof window !== 'undefined' ? localStorage.getItem('selectedBranch') : null
        const response = await productsService.featured(8, branch || undefined)
        const products = response.map(apiProductToProduct)
        setFeaturedProducts(products)
      } catch (err) {
        console.error('Error cargando productos destacados:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  return (
    <div className="min-h-screen bg-warm-radial">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-bakery-gradient">
        {/* Decorative floating elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[15%] text-7xl opacity-[0.07] animate-float">🥖</div>
          <div className="absolute right-[8%] top-[20%] text-6xl opacity-[0.07] animate-float" style={{ animationDelay: '0.5s' }}>🥐</div>
          <div className="absolute left-[15%] bottom-[10%] text-6xl opacity-[0.06] animate-float" style={{ animationDelay: '1s' }}>🍪</div>
          <div className="absolute right-[12%] bottom-[15%] text-7xl opacity-[0.06] animate-float" style={{ animationDelay: '1.5s' }}>🎂</div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center animate-fade-up">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-scale-in">
              Panadería Artesanal de Guatemala
            </span>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Pan Artesanal Fresco
              <br />
              <span className="text-primary">Cada Día</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Productos de panadería guatemalteca con ingredientes de calidad.
              Reserva en línea y recoge en tu sucursal favorita.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={ROUTES.products}>
                <Button size="lg" className="text-base px-8 shadow-warm transition-transform hover:scale-105">
                  Ver Productos
                </Button>
              </Link>
              <Link href={ROUTES.about}>
                <Button size="lg" variant="outline" className="text-base px-8 transition-transform hover:scale-105">
                  Conocer Más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 stagger-children">
            <div className="group text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                <Calendar className="h-9 w-9 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">Reserva en Línea</h3>
              <p className="text-sm text-muted-foreground">
                Haz tu pedido y recoge en la sucursal de tu preferencia
              </p>
            </div>
            <div className="group text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                <Store className="h-9 w-9 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">Recoge en Sucursal</h3>
              <p className="text-sm text-muted-foreground">
                Tu pedido listo para recoger cuando lo necesites
              </p>
            </div>
            <div className="group text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                <Wheat className="h-9 w-9 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">Pan Fresco</h3>
              <p className="text-sm text-muted-foreground">
                Horneado diariamente con ingredientes de calidad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center animate-fade-up">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Productos Destacados
          </h2>
          <p className="mt-3 text-muted-foreground">
            Los favoritos de nuestros clientes
          </p>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-primary/30" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="aspect-square shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 rounded shimmer" />
                  <div className="h-4 w-1/2 rounded shimmer" />
                  <div className="h-8 w-full rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">🥖</div>
            <p className="text-muted-foreground">No hay productos disponibles en este momento.</p>
            <Link href={ROUTES.products}>
              <Button className="mt-4">Ver catálogo completo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {featuredProducts.slice(0, 8).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(id) => {
                  const p = featuredProducts.find(x => x.id === id)
                  if (p) addItem(p, 1)
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href={ROUTES.products}>
            <Button size="lg" variant="outline" className="px-8 transition-transform hover:scale-105">Ver todos los productos</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
