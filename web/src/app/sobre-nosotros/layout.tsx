import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre nosotros | Panadería Svetlana',
  description: 'Conoce la historia y el compromiso de Panadería Svetlana con el pan fresco en Guatemala.',
}

export default function SobreNosotrosLayout({ children }: { children: React.ReactNode }) {
  return children
}
