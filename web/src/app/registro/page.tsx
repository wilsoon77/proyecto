import Link from "next/link"
import { ROUTES } from "@/lib/constants"

export default function RegistroPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Crear Cuenta</h1>
      <p className="mb-8 text-gray-600">Interfaz lista para registro (pendiente backend).</p>
      <form className="space-y-4">
        <input className="w-full rounded-md border p-3" placeholder="Nombre" />
        <input className="w-full rounded-md border p-3" placeholder="Apellido" />
        <input className="w-full rounded-md border p-3" placeholder="Correo electrónico" />
        <input className="w-full rounded-md border p-3" type="password" placeholder="Contraseña" />
        <button className="w-full rounded-md bg-black p-3 font-medium text-white" type="button">Registrarme</button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-700">
        ¿Ya tienes cuenta? {" "}
        <Link href={ROUTES.login} className="text-primary hover:underline">Inicia sesión</Link>
      </p>
    </div>
  )
}
