"use client"

import Link from "next/link"
import { 
  Heart, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Users, 
  MapPin, 
  ArrowRight, 
  Flame, 
  Wheat, 
  Award,
  Store,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export default function SobreNosotrosPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-white py-16 sm:py-24 border-b border-amber-100/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-900 border border-amber-200">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <span>Tradición Artesanal & Pasión Familiar</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl font-serif">
              Horneando momentos inolvidables en <span className="text-primary underline decoration-amber-300 decoration-wavy">Chimaltenango</span>
            </h1>
            
            <p className="text-lg text-gray-700 leading-relaxed font-sans sm:text-xl">
              En <strong className="text-gray-900 font-semibold">Panadería Svetlana</strong> honramos las recetas tradicionales guatemaltecas con procesos de fermentación natural y tecnología moderna para llevar a tu mesa el pan más crujiente, aromático y fresco cada mañana y tarde.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href={ROUTES.products}>
                <Button size="lg" className="h-12 px-7 text-base font-semibold shadow-md shadow-amber-900/10">
                  Explorar Catálogo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={ROUTES.contact}>
                <Button variant="outline" size="lg" className="h-12 px-7 text-base font-semibold border-gray-300 hover:bg-amber-50">
                  Nuestras Sucursales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores de Confianza / Stats */}
      <section className="py-12 bg-amber-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8 text-center">
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60">
              <p className="text-3xl sm:text-4xl font-black text-amber-400 font-serif">+15</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-amber-100">Años de tradición</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60">
              <p className="text-3xl sm:text-4xl font-black text-amber-400 font-serif">2</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-amber-100">Hornadas diarias (5 AM y 2 PM)</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60">
              <p className="text-3xl sm:text-4xl font-black text-amber-400 font-serif">100%</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-amber-100">Frescura garantizada</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60">
              <p className="text-3xl sm:text-4xl font-black text-amber-400 font-serif">2</p>
              <p className="mt-1 text-sm sm:text-base font-medium text-amber-100">Sucursales en Chimaltenango</p>
            </div>
          </div>
        </div>
      </section>

      {/* Historia & Origen */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                <Wheat className="h-3.5 w-3.5" />
                Nuestras Raíces
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-serif leading-tight">
                El aroma del pan recién horneado que une a las familias
              </h2>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                <strong>Panadería Svetlana</strong> nació del amor por la panadería artesanal guatemalteca. Lo que comenzó como un pequeño emprendimiento familiar con una receta tradicional de pan francés y champurradas, creció gracias a la preferencia de nuestra comunidad en Chimaltenango.
              </p>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                Para nosotros, el pan es mucho más que un alimento: es el centro del desayuno con frijolitos y queso, la merienda con café caliente por la tarde y el motivo para compartir en familia. Por eso, nos negamos a usar atajos artificiales o masas prefabricadas; cada pieza es moldeada a mano y horneada con el cariño de siempre.
              </p>
              <div className="pt-2 border-l-4 border-amber-500 pl-4 italic text-gray-800 font-serif text-lg">
                &ldquo;Trabajamos cada madrugada con una sola meta: que al abrir tu bolsa de pan, el aroma y lo crujiente te recuerden lo lindo de nuestras tradiciones.&rdquo;
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl bg-gradient-to-tr from-amber-100 to-orange-100 p-8 sm:p-10 border border-amber-200/80 shadow-sm space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  Nuestra Filosofía de Trabajo
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-gray-900 font-semibold block">Ingredientes de primera</strong>
                      <span className="text-gray-700 text-sm">Harinas seleccionadas, huevos frescos de granja y mantecas certificadas para un sabor inigualable.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-gray-900 font-semibold block">Horneado continuo</strong>
                      <span className="text-gray-700 text-sm">Producción organizada en dos turnos diarios para que siempre encuentres pan recién salido del horno.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-gray-900 font-semibold block">Innovación y comodidad</strong>
                      <span className="text-gray-700 text-sm">Sistema inteligente para reservar tu pedido en línea y recoger en sucursal sin esperas.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Pilares / Valores */}
      <section className="py-16 sm:py-24 bg-stone-50 border-y border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-serif">
              Nuestros Pilares Fundamentales
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Los valores y principios que guían nuestro trabajo en cada masa, horno y mostrador.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Frescura Absoluta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                El pan de hoy se hornea hoy. No vendemos pan del día anterior; mantenemos estándares estrictos de rotación de producto.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Calidad e Higiene</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Áreas de producción sanitizadas, control riguroso de materias primas y manipulación higiénica en todo el proceso.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Pasión Artesanal</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Maestros panaderos con años de experiencia que moldean con esmero cada concha, francés y champurrada tradicional.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Servicio Cercano</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Atención cálida, respetuosa y eficiente. Atendemos a nuestros vecinos y clientes como si fueran de nuestra propia familia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de Elaboración */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
              <Clock className="h-3.5 w-3.5" />
              Proceso Diario
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-serif">
              ¿Cómo hacemos nuestro pan cada día?
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              La combinación exacta entre tiempo de reposo, ingredientes seleccionados y horneado en su punto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="relative p-6 rounded-xl border border-amber-100 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-serif text-amber-300">01</span>
                <Wheat className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Selección & Mezclado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pesaje exacto de ingredientes, harinas refinadas e inicio del amasado para lograr la elasticidad ideal.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-amber-100 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-serif text-amber-300">02</span>
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Fermentación Lenta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dejamos que la masa crezca a su propio ritmo, desarrollando sabor auténtico y una miga suave y aireada.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-amber-100 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-serif text-amber-300">03</span>
                <Heart className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Moldeado a Mano</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nuestros artesanos dan forma a las tiras de pan francés, conchas, shecas y repostería una por una.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-amber-100 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-serif text-amber-300">04</span>
                <Flame className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Horneado & Salida</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Horneado a temperatura exacta para lograr la corteza dorada y crujiente, listo para entrega inmediata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestras Sucursales */}
      <section className="py-16 sm:py-20 bg-stone-100/60 border-t border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 font-serif">Visítanos en Chimaltenango</h2>
            <p className="text-gray-600 text-sm sm:text-base">Contamos con dos ubicaciones estratégicas para atenderte con la mayor comodidad.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sucursal Central</h3>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Casa Matriz</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                Aldea Buena Vista, Zona 8, Sector Sur, Chimaltenango
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Horario: 5:00 AM – 8:30 PM</span>
                <span className="font-semibold text-gray-900">📞 +502 1234-5678</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sucursal Secundaria</h3>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pradera</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                Frente a Pradera Chimaltenango, Chimaltenango
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Horario: 5:30 AM – 9:00 PM</span>
                <span className="font-semibold text-gray-900">📞 +502 8765-4321</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif">
            ¿Listo para disfrutar del mejor pan artesanal?
          </h2>
          <p className="text-amber-100 text-base sm:text-lg max-w-2xl mx-auto">
            Explora nuestro catálogo en línea, añade tus productos al carrito y recoge tu pedido recién horneado en cualquiera de nuestras sucursales.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link href={ROUTES.products}>
              <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50 font-bold h-12 px-8 shadow-lg">
                Ver Catálogo de Productos
              </Button>
            </Link>
            <Link href={ROUTES.contact}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold h-12 px-8">
                Contáctanos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
