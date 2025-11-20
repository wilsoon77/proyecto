import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { SHIPPING } from "@/lib/constants"

export default function Home() {
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
            Entrega a domicilio en toda Guatemala.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" className="text-base">
              Ver Productos
            </Button>
            <Button size="lg" variant="outline" className="text-base">
              Conocer Más
            </Button>
          </div>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="border-y bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Envío a Guatemala</h3>
              <p className="text-sm text-gray-600">
                Entrega en todo el país desde {formatPrice(SHIPPING.baseFee)}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🎁</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Envío Gratis</h3>
              <p className="text-sm text-gray-600">
                En compras mayores a {formatPrice(SHIPPING.freeShippingThreshold)}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🥖</span>
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Product Card 1 */}
          <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="aspect-square bg-gray-100">
              <div className="flex h-full items-center justify-center text-6xl">
                🥖
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Pan Francés</h3>
              <p className="mt-1 text-sm text-gray-500">Tradicional guatemalteco</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(2.50)}
                </span>
                <Button size="sm">Agregar</Button>
              </div>
            </div>
          </div>

          {/* Product Card 2 */}
          <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="aspect-square bg-gray-100">
              <div className="flex h-full items-center justify-center text-6xl">
                🍞
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Pan Dulce</h3>
              <p className="mt-1 text-sm text-gray-500">Receta tradicional</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(3.00)}
                </span>
                <Button size="sm">Agregar</Button>
              </div>
            </div>
          </div>

          {/* Product Card 3 */}
          <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="aspect-square bg-gray-100">
              <div className="flex h-full items-center justify-center text-6xl">
                🍪
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Galletas</h3>
              <p className="mt-1 text-sm text-gray-500">Docena surtida</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(25.00)}
                </span>
                <Button size="sm">Agregar</Button>
              </div>
            </div>
          </div>

          {/* Product Card 4 */}
          <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="aspect-square bg-gray-100">
              <div className="flex h-full items-center justify-center text-6xl">
                🎂
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Pastel Pequeño</h3>
              <p className="mt-1 text-sm text-gray-500">Para 4-6 personas</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(120.00)}
                </span>
                <Button size="sm">Agregar</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
