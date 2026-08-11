"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApiProductPresentationInput } from "@/lib/api/types"

interface ProductPresentationsEditorProps {
  value: ApiProductPresentationInput[]
  onChange: (value: ApiProductPresentationInput[]) => void
}

export function ProductPresentationsEditor({ value, onChange }: ProductPresentationsEditorProps) {
  const addPresentation = () => {
    onChange([
      ...value,
      {
        name: "",
        unitsInStock: 1,
        price: 0,
        isForSale: true,
        isForProduction: false,
        isDefault: value.length === 0,
        isActive: true,
        sortOrder: value.length,
      },
    ])
  }

  const update = (index: number, patch: Partial<ApiProductPresentationInput>) => {
    onChange(value.map((presentation, currentIndex) => currentIndex === index ? { ...presentation, ...patch } : presentation))
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Presentaciones del producto</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Define cómo se vende o produce sin crear otro producto. El inventario se descuenta según las piezas equivalentes.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addPresentation}>
          <Plus className="mr-1 h-4 w-4" />Agregar
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
          Sin presentaciones: se usará el precio y la unidad base actuales.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((presentation, index) => (
            <div key={presentation.id ?? `new-${index}`} className="rounded-lg border border-border bg-card p-3">
              <div className="grid gap-3 sm:grid-cols-[1.4fr_0.7fr_0.8fr_auto]">
                <label className="text-xs font-medium text-muted-foreground">
                  Nombre
                  <input
                    value={presentation.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                    placeholder="Media tira"
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Piezas
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={presentation.unitsInStock}
                    onChange={(event) => update(index, { unitsInStock: Math.max(1, Number(event.target.value) || 1) })}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Precio Q
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={presentation.price ?? ""}
                    onChange={(event) => update(index, { price: event.target.value === "" ? null : Number(event.target.value) })}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <Button type="button" variant="ghost" size="icon" className="self-end text-destructive" onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))} aria-label="Eliminar presentación">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={presentation.isForSale !== false} onChange={(event) => update(index, { isForSale: event.target.checked })} />
                  Venta
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={presentation.isForProduction === true} onChange={(event) => update(index, { isForProduction: event.target.checked })} />
                  Producción
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={presentation.isDefault === true} onChange={(event) => {
                    if (!event.target.checked) update(index, { isDefault: false })
                    else onChange(value.map((item, currentIndex) => ({ ...item, isDefault: currentIndex === index })))
                  }} />
                  Predeterminada
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={presentation.isActive !== false} onChange={(event) => update(index, { isActive: event.target.checked })} />
                  Activa
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

