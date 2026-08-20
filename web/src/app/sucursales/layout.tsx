import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getPublicBranches } from '@/lib/catalog/public-api'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Sucursales | Panadería Svetlana',
  description: 'Encuentra la sucursal de Panadería Svetlana más cercana en Guatemala.',
  alternates: { canonical: `${siteUrl}/sucursales` },
}

export default async function SucursalesLayout({ children }: { children: ReactNode }) {
  const branches = await getPublicBranches()
  const jsonLd = branches.map((branch) => ({
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: branch.name,
    url: `${siteUrl}/sucursales#${branch.slug}`,
    telephone: branch.phone || undefined,
    servesCuisine: 'Panadería',
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.address,
      addressLocality: 'Guatemala',
      addressCountry: 'GT',
    },
    geo: branch.latitude != null && branch.longitude != null
      ? {
          '@type': 'GeoCoordinates',
          latitude: branch.latitude,
          longitude: branch.longitude,
        }
      : undefined,
  }))

  return (
    <>
      {jsonLd.map((entry) => (
        <script
          key={entry.url}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry).replace(/</g, '\\u003c') }}
        />
      ))}
      {children}
    </>
  )
}
