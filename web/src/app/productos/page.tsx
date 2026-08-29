import type { Metadata } from 'next'
import { CatalogClient } from '@/components/products/CatalogClient'
import { getPublicCatalog, getPublicCategories } from '@/lib/catalog/public-api'
import type { ProductFilters } from '@/lib/api/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Productos | Panadería Svetlana',
  description: 'Explora el catálogo de pan fresco, pan dulce tradicional y repostería horneada de Panadería Svetlana.',
  alternates: { canonical: '/productos' },
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function positiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

function parseFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const sort = first(params.sort)
  return {
    search: first(params.q)?.trim() || undefined,
    category: first(params.cat)?.trim() || undefined,
    min: positiveNumber(first(params.min)),
    max: positiveNumber(first(params.max)),
    sort: sort === 'precio-asc' || sort === 'precio-desc' || sort === 'nuevo' ? sort : undefined,
    branch: first(params.branch)?.trim() || undefined,
    page: 1,
    pageSize: 12,
  }
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const filters = parseFilters(await searchParams)
  const [catalog, categories] = await Promise.all([
    getPublicCatalog(filters),
    getPublicCategories(),
  ])

  return <CatalogClient initialCatalog={catalog} categories={categories} filters={filters} />
}
