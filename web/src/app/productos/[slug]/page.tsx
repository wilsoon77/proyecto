import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/products/ProductDetailClient'
import { getPublicCatalog, getPublicProduct, getRelatedPublicProducts } from '@/lib/catalog/public-api'
import { apiProductToProduct } from '@/lib/api/transformers'
import { defaultSalePresentation, presentationUnitPrice } from '@/lib/presentation-quantities'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const revalidate = 60
export const dynamicParams = true

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const catalog = await getPublicCatalog({ page: 1, pageSize: 100 })
  return catalog.data.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  if (!product) return { title: 'Producto no encontrado | Panadería Svetlana' }

  const image = product.images?.[0]?.url
  return {
    title: `${product.name} | Panadería Svetlana`,
    description: product.description || `Compra ${product.name} en Panadería Svetlana.`,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.description || `Compra ${product.name} en Panadería Svetlana.`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || `Compra ${product.name} en Panadería Svetlana.`,
      images: image ? [image] : ['/images/Panaderia_Svetlana_logo.jpeg'],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const apiProduct = await getPublicProduct(slug)
  if (!apiProduct) notFound()

  const [related] = await Promise.all([
    getRelatedPublicProducts(apiProduct.categorySlug || apiProduct.category, apiProduct.slug),
  ])
  const product = apiProductToProduct(apiProduct)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images,
    sku: apiProduct.sku,
    offers: {
      '@type': 'Offer',
      price: presentationUnitPrice(product, defaultSalePresentation(product)).toFixed(2),
      priceCurrency: 'GTQ',
      availability: product.stock > 0 && product.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: `${siteUrl}/productos` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${siteUrl}/productos/${product.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />
      <ProductDetailClient product={product} relatedProducts={related.map(apiProductToProduct)} />
    </>
  )
}
