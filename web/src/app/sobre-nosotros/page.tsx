"use client"

export default function SobreNosotrosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Sobre nosotros</h1>
      <p className="mb-8 text-gray-600">Conoce nuestra historia, misión y valores.</p>

      <div className="space-y-8">
        <section className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold">Nuestra misión</h2>
          <p className="mt-2 text-gray-700">Hornear productos frescos y deliciosos cada día, con ingredientes de calidad y servicio cercano a la comunidad.</p>
        </section>

        <section className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold">Nuestros valores</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
            <li>Calidad y frescura</li>
            <li>Atención al cliente</li>
            <li>Compromiso con Guatemala</li>
          </ul>
        </section>

        <section className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold">Nuestra historia</h2>
          <p className="mt-2 text-gray-700">Nacimos como una panadería familiar y evolucionamos a un sistema inteligente para servir mejor a nuestros clientes y sucursales.</p>
        </section>
      </div>
    </div>
  )
}
