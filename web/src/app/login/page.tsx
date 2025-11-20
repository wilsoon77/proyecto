import Link from "next/link"
import { ROUTES } from "@/lib/constants"

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Iniciar Sesión</h1>
      <p className="mb-8 text-gray-600">Interfaz lista para futura autenticación.</p>
      <form className="space-y-4">
        <input className="w-full rounded-md border p-3" placeholder="Correo electrónico" />
        <input className="w-full rounded-md border p-3" type="password" placeholder="Contraseña" />
        <button className="w-full rounded-md bg-black p-3 font-medium text-white" type="button">Ingresar</button>
      </form>
      <div className="my-6 flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500">o</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="grid gap-2">
        <button className="w-full rounded-md border bg-white p-3 text-sm">Continuar con Google (demo)</button>
        <button className="w-full rounded-md border bg-white p-3 text-sm">Continuar con Facebook (demo)</button>
      </div>
      <p className="mt-6 text-center text-sm text-gray-700">
        ¿No tienes cuenta? {" "}
        <Link href={ROUTES.register} className="text-primary hover:underline">Crear cuenta</Link>
      </p>
    </div>
  )
}
