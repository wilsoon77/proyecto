"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { useCart } from "@/context/CartContext"
import { productsService } from "@/lib/api"
import { apiProductToProduct } from "@/lib/api/transformers"
import type { Product } from "@/types"
import { ProductCard } from "@/components/products/ProductCard"

export default function Home() {
  const router = useRouter()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCart()

  // Detectar tokens de recuperación de contraseña y redirigir
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      // Redirigir a reset-password manteniendo el hash con los tokens
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Pan Artesanal Fresco
            <br />
            <span className="text-primary">Cada Día</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Productos de panadería guatemalteca con ingredientes de calidad.
            Reserva en línea y recoge en tu sucursal favorita.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href={ROUTES.products}>
              <Button size="lg" className="text-base">
                Ver Productos
              </Button>
            </Link>
            <Link href={ROUTES.about}>
              <Button size="lg" variant="outline" className="text-base">
                Conocer Más
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="border-y bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <img src="/icon-reserva-linea.svg" alt="reserva" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Reserva en Línea</h3>
              <p className="text-sm text-gray-600">
                Haz tu pedido y recoge en la sucursal de tu preferencia
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <img src="/icon-recoge-sucursal.svg" alt="reserva" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Recoge en Sucursal</h3>
              <p className="text-sm text-gray-600">
                Tu pedido listo para recoger cuando lo necesites
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <img src="/icon-pan-fresco.svg" alt="reserva" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Pan Fresco</h3>
              <p className="text-sm text-gray-600">
                Horneado diariamente con ingredientes de calidad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Productos Destacados
          </h2>
          <p className="mt-4 text-gray-600">
            Los favoritos de nuestros clientes
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse overflow-hidden rounded-lg border bg-white">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-8 w-full rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay productos disponibles en este momento.</p>
            <Link href={ROUTES.products}>
              <Button className="mt-4">Ver catálogo completo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <Button size="lg" variant="outline">Ver todos los productos</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
