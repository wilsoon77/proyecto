"use client"

import type { ProductPresentation } from "@/types"

interface PresentationCountFieldsProps {
  presentations: ProductPresentation[]
  values: Record<string, string>
  looseValue: string
  unitLabel: string
  onChange: (presentationId: number, value: string) => void
  onLooseChange: (value: string) => void
  label: string
}

export function PresentationCountFields({
  presentations,
  values,
  looseValue,
  unitLabel,
  onChange,
  onLooseChange,
  label,
}: PresentationCountFieldsProps) {
  if (presentations.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid min-w-[170px] gap-2">
        {presentations.map((presentation) => (
          <label key={presentation.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{presentation.name}</span>
            <input
              type="number"
              min="0"
              step="1"
              value={values[String(presentation.id)] ?? ""}
              onChange={(event) => onChange(presentation.id, event.target.value)}
              className="w-20 rounded-md border border-border px-2 py-1.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`${label} ${presentation.name}`}
            />
          </label>
        ))}
        <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Sueltas ({unitLabel})</span>
          <input
            type="number"
            min="0"
            step="1"
            value={looseValue}
            onChange={(event) => onLooseChange(event.target.value)}
            className="w-20 rounded-md border border-border px-2 py-1.5 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={`${label} sueltas`}
          />
        </label>
      </div>
    </div>
  )
}

