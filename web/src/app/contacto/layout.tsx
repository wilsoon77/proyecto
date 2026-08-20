import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto | Panadería Svetlana',
  description: 'Encuentra los canales de contacto de Panadería Svetlana y consulta nuestras sucursales.',
}

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children
}
