import type { Product, ProductPresentation } from '@/types'

export function salePresentations(product: Product): ProductPresentation[] {
  return (product.presentations ?? []).filter((presentation) => presentation.isActive && presentation.isForSale)
}

export function productionPresentations(product: Product): ProductPresentation[] {
  return (product.presentations ?? []).filter((presentation) => presentation.isActive && presentation.isForProduction)
}

export function defaultSalePresentation(product: Product): ProductPresentation | undefined {
  const presentations = salePresentations(product)
  return presentations.find((presentation) => presentation.isDefault) ?? presentations[0]
}

export function maxPresentationQuantity(product: Product, presentation?: ProductPresentation): number {
  if (!presentation || presentation.unitsInStock <= 0) return product.stock
  return product.stock > 0 ? Math.floor(product.stock / presentation.unitsInStock) : 0
}

export function presentationUnitPrice(product: Product, presentation?: ProductPresentation): number {
  return presentation?.price ?? product.price
}

export function cartLineKey(productId: number, presentationId?: number): string {
  return `${productId}:${presentationId ?? 'base'}`
}

export function baseQuantityFromCounts(
  counts: Record<string, string>,
  presentations: ProductPresentation[],
  loose = '',
): number {
  const looseQuantity = loose === '' ? 0 : Number(loose)
  if (!Number.isInteger(looseQuantity) || looseQuantity < 0) return Number.NaN
  return presentations.reduce((total, presentation) => {
    const value = counts[String(presentation.id)] ?? ''
    const quantity = value === '' ? 0 : Number(value)
    if (!Number.isInteger(quantity) || quantity < 0) return Number.NaN
    return total + quantity * presentation.unitsInStock
  }, looseQuantity)
}

export function breakdownBaseQuantity(quantity: number, presentations: ProductPresentation[]) {
  const ordered = [...presentations].sort((a, b) => b.unitsInStock - a.unitsInStock)
  let remaining = Math.max(0, Math.floor(quantity))
  const counts: Record<string, string> = {}
  for (const presentation of ordered) {
    const count = Math.floor(remaining / presentation.unitsInStock)
    counts[String(presentation.id)] = String(count)
    remaining %= presentation.unitsInStock
  }
  return { counts, loose: String(remaining) }
}

export function formatBaseQuantity(product: Product, quantity: number): string {
  const presentations = salePresentations(product)
  if (!presentations.length) return `${quantity} ${product.stockUnitLabel ?? 'unidades'}`
  const { counts, loose } = breakdownBaseQuantity(quantity, presentations)
  const parts = presentations
    .map((presentation) => {
      const count = Number(counts[String(presentation.id)] ?? 0)
      return count > 0 ? `${count} ${presentation.name.toLowerCase()}` : ''
    })
    .filter(Boolean)
  if (Number(loose) > 0) parts.push(`${loose} ${product.stockUnitLabel ?? 'piezas'}`)
  return parts.join(' + ') || `0 ${product.stockUnitLabel ?? 'piezas'}`
}

