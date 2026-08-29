import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

interface CategoryBadgeProps {
  category: string
  label?: string
  className?: string
}

export function CategoryBadge({ category, label, className }: CategoryBadgeProps) {
  // Usa el label proporcionado (del DB) o capitaliza el slug como fallback
  const displayLabel = label || category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <Badge className={`border-border bg-secondary px-3 py-1 font-semibold text-foreground shadow-none ${className || ''}`} variant="secondary">
      <Tag className="mr-1.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />
      {displayLabel}
    </Badge>
  )
}

