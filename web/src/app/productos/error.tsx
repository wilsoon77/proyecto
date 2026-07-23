'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProductosError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('No fue posible renderizar el catálogo:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">No pudimos cargar el catálogo</h1>
      <p className="mt-2 text-gray-600">Intenta nuevamente en unos momentos.</p>
      <Button className="mt-6" onClick={reset}>Reintentar</Button>
    </div>
  )
}
