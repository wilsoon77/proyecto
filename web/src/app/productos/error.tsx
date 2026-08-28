'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProductosError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('No fue posible renderizar el catálogo:', error)
  }, [error])

  return (
    <div className="public-container flex min-h-[50dvh] items-center justify-center py-16 text-center">
      <div className="surface-panel w-full max-w-lg px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-foreground">No pudimos cargar el catálogo</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Intenta nuevamente en unos momentos.</p>
        <Button className="mt-6 rounded-full px-6" onClick={reset}>Reintentar</Button>
      </div>
    </div>
  )
}
