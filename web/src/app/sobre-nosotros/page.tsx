import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock3, Flame, Heart, MapPin, Phone, ShieldCheck, Store, Wheat } from "lucide-react"
import MultiBranchMap from "@/components/layout/MultiBranchMap"
import { Button } from "@/components/ui/button"
import { STATIC_BRANCHES } from "@/lib/branches"
import { ROUTES } from "@/lib/constants"
import { ArtisanMarquee } from "@/components/home/ArtisanMarquee"

export default function SobreNosotrosPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="public-container grid gap-10 pb-16 pt-10 sm:pb-24 sm:pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16 lg:pb-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            Nuestra historia
          </div>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-[#24140D] sm:text-5xl lg:text-6xl">
            El aroma que vuelve a reunirnos.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[#6E5545] sm:text-lg">
            En Panadería Svetlana honramos el pan artesanal guatemalteco con recetas cuidadas, masa madre, fermentación natural y una atención cálida y cercana en Chimaltenango.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={ROUTES.products} className="w-full sm:w-auto">
              <Button size="lg" className="touch-tactile public-focus h-12 w-full rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:w-auto">
                Explorar productos <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href={ROUTES.branches} className="public-focus inline-flex h-12 w-full items-center justify-center rounded-full border border-[#DECDBB] bg-white px-6 text-sm font-bold text-[#2B170F] shadow-sm hover:bg-[#FAF5EE] sm:w-auto">
              Ver sucursales
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-4 sm:p-6 shadow-sm">
          <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-2xl border border-[#DECDBB] bg-white p-6 sm:min-h-[440px] sm:p-10 shadow-inner">
            <div className="absolute left-5 top-5 h-20 w-20 rounded-full border border-amber-300/40" aria-hidden="true" />
            <div className="absolute bottom-5 right-5 h-24 w-24 rounded-full border border-amber-300/40" aria-hidden="true" />
            <Image src="/images/logo-panaderia.svg" alt="Logo de Panadería Svetlana" width={920} height={518} className="relative h-auto w-full max-w-[480px] object-contain" />
          </div>
        </div>
      </section>

      {/* Bento Values: 3 Colored Cards */}
      <section className="border-y border-[#E8DCCB] bg-[#F7F1E8] py-14 sm:py-20">
        <div className="public-container">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
              Lo que nos mueve
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-[#24140D] sm:text-4xl">
              Hacerlo bien también se siente.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {/* Card 1: Oat */}
            <div className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8DAC9] text-[#A25514] mb-4">
                <Wheat className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#2B170F]">Ingredientes cuidados</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5C3D2E]">
                Seleccionamos materias primas puras que respetan el sabor, textura y aroma de cada receta tradicional.
              </p>
            </div>

            {/* Card 2: Deep Espresso */}
            <div className="rounded-3xl border border-[#42261B] bg-[#2B170F] p-6 text-[#FAF5EE] shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D2317] text-[#F59E0B] mb-4">
                <Flame className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">Horneado constante</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#D2C3B4]">
                2 hornadas diarias a las 5 AM y 2 PM para que siempre encuentres pan caliente y recién salido del horno.
              </p>
            </div>

            {/* Card 3: Warm Amber */}
            <div className="rounded-3xl border border-[#ECCDB5] bg-[#FAF0E6] p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0DDCD] text-[#C85A17] mb-4">
                <Heart className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#2B170F]">Servicio cercano</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5C3D2E]">
                Atendemos a nuestros vecinos de Chimaltenango con la misma calidez con la que trabajamos la masa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Artisan Quality Ticker */}
      <ArtisanMarquee
        kicker="Sellos y Certificaciones"
        title="Garantía de origen y frescura artesanal"
        className="border-y border-[#DECDBB] bg-[#F3E9DC]"
      />

      {/* Story Narrative */}
      <section className="public-container grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_0.78fr] lg:items-start lg:gap-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
            Pan con memoria
          </div>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#24140D] sm:text-4xl">
            El pan está presente en los momentos sencillos.
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-[#6E5545]">
            <p>Panadería Svetlana nació del amor por la panadería artesanal guatemalteca. Lo que comenzó como un emprendimiento familiar con recetas de pan francés, conchas y champurradas creció gracias a la preferencia de las familias de Chimaltenango.</p>
            <p>Para nosotros, el pan acompaña el café de la mañana, la merienda de la tarde y la mesa familiar. Por eso cada pieza se prepara con dedicación, fermentación natural y sin aditivos artificiales.</p>
          </div>
          <blockquote className="mt-8 border-l-3 border-[#D97706] pl-5 font-display text-xl italic leading-relaxed text-[#2B170F] sm:text-2xl">
            “Trabajamos cada madrugada para que al abrir tu bolsa de pan reconozcas el aroma auténtico de casa.”
          </blockquote>
        </div>

        {/* Deep Roast Card: Standards */}
        <div className="rounded-3xl border border-[#42261B] bg-[#2B170F] p-6 text-[#FAF5EE] shadow-xl sm:p-8">
          <div className="flex items-start gap-3 border-b border-white/10 pb-5">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#F59E0B]" aria-hidden="true" />
            <div>
              <h3 className="font-display text-2xl font-semibold text-white">Nuestros Compromisos</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#D2C3B4]">Lo artesanal se demuestra en la constancia y el respeto a la receta.</p>
            </div>
          </div>
          <ul className="mt-6 space-y-5">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-bold text-white">Ingredientes de primera</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#D2C3B4]">Harinas 100% seleccionadas, masa madre activa y materias primas frescas.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-bold text-white">Producción por turnos</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#D2C3B4]">Dos momentos de horneado diario (5:00 AM y 2:00 PM) para máxima frescura.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-bold text-white">Reserva sin espera</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#D2C3B4]">Pide tus panes en línea y retíralos sin hacer cola en sucursal.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* 4 Process Steps Bento */}
      <section className="border-y border-[#E8DCCB] bg-[#F7F1E8] py-16 sm:py-24">
        <div className="public-container">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
              Del horno a la bolsa
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-[#24140D] sm:text-4xl">
              Cada etapa tiene su tiempo.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6E5545] sm:text-base">
              La textura y el sabor auténticos empiezan mucho antes de que el pan entre al horno.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
              <span className="font-display text-3xl font-bold text-[#8C522B]">01</span>
              <h3 className="mt-3 text-base font-bold text-[#2B170F]">Mezclar</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">Pesamos con precisión los ingredientes y preparamos el fermento madre.</p>
            </div>
            <div className="rounded-3xl border border-[#ECCDB5] bg-[#FAF0E6] p-6 shadow-sm">
              <span className="font-display text-3xl font-bold text-[#C85A17]">02</span>
              <h3 className="mt-3 text-base font-bold text-[#2B170F]">Reposar</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">Damos tiempo a la masa para que leude lentamente y desarrolle su sabor.</p>
            </div>
            <div className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
              <span className="font-display text-3xl font-bold text-[#8C522B]">03</span>
              <h3 className="mt-3 text-base font-bold text-[#2B170F]">Formar</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#5C3D2E]">Cada pieza (concha, cuernito, francés) se porciona y marca a mano.</p>
            </div>
            <div className="rounded-3xl border border-[#42261B] bg-[#2B170F] p-6 text-[#FAF5EE] shadow-lg">
              <span className="font-display text-3xl font-bold text-[#F59E0B]">04</span>
              <h3 className="mt-3 text-base font-bold text-white">Hornear</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#D2C3B4]">El calor transforma la masa en corteza dorada y miga suave lista para disfrutar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className="public-container py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
              Ven a visitarnos
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-[#24140D] sm:text-4xl">
              Dos puntos para encontrarnos.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#6E5545]">
              Reserva en línea y selecciona dónde recoger, o pasa a saludarnos cuando estés cerca.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {STATIC_BRANCHES.map((branch) => (
              <div key={branch.id} className="rounded-3xl border border-[#DECDBB] bg-[#F3E9DC] p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#2B170F]">{branch.name}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#D97706]">Chimaltenango</p>
                  </div>
                  <Store className="h-5 w-5 shrink-0 text-[#D97706]" aria-hidden="true" />
                </div>
                <div className="mt-5 space-y-2.5 text-xs text-[#5C3D2E]">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                    {branch.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                    {branch.schedule}
                  </p>
                </div>
                <a href={branch.mapsUrl} target="_blank" rel="noreferrer" className="public-focus mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#D97706] hover:text-[#A25514]">
                  Abrir ubicación en Maps <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 overflow-hidden rounded-3xl border border-[#DECDBB] bg-white p-3 shadow-sm">
          <MultiBranchMap />
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="public-container pb-16 sm:pb-24">
        <div className="flex flex-col gap-6 rounded-[2.5rem] border border-[#44281B] bg-[#24130B] px-6 py-12 text-[#FAF5EE] shadow-2xl sm:flex-row sm:items-end sm:justify-between sm:px-12 sm:py-14">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Conoce el catálogo que preparamos hoy.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#D6C4B4] sm:text-base">
              Encuentra tus favoritos y reserva para recoger en tu sucursal más cercana.
            </p>
          </div>
          <Link href={ROUTES.products} className="public-focus inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90">
            Ver productos <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
