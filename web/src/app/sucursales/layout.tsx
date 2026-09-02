import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getPublicBranches } from '@/lib/catalog/public-api'

import { SITE_URL } from '@/lib/constants'

const siteUrl = SITE_URL

export const metadata: Metadata = {
  title: 'Sucursales | Panadería Svetlana',
  description: 'Encuentra la sucursal de Panadería Svetlana más cercana en Chimaltenango, Guatemala.',
  alternates: { canonical: `${siteUrl}/sucursales` },
  openGraph: {
    type: 'website',
    locale: 'es_GT',
    url: `${siteUrl}/sucursales`,
    title: 'Sucursales | Panadería Svetlana',
    description: 'Encuentra la sucursal de Panadería Svetlana más cercana en Chimaltenango, Guatemala.',
    images: [{ url: `${siteUrl}/images/hero-concha-pedestal.jpg`, width: 1200, height: 630, alt: 'Sucursales Panadería Svetlana' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@panaderiasvetlana',
    title: 'Sucursales | Panadería Svetlana',
    description: 'Encuentra la sucursal de Panadería Svetlana más cercana en Chimaltenango, Guatemala.',
    images: [`${siteUrl}/images/hero-concha-pedestal.jpg`],
  },
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
