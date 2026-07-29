import { Badge } from "@/components/ui/badge"
import { Croissant, CakeSlice, Cookie, Candy, Sparkles, Coffee, Cherry, Shell } from "lucide-react"

interface CategoryBadgeProps {
  category: string
  label?: string
  className?: string
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pan: { icon: Croissant, color: 'bg-primary/10 text-primary border-primary/20' },
  pasteles: { icon: CakeSlice, color: 'bg-chart-5/10 text-chart-5 border-chart-5/20' },
  galletas: { icon: Cookie, color: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  dulces: { icon: Candy, color: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  especiales: { icon: Sparkles, color: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  bebidas: { icon: Coffee, color: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  reposteria: { icon: Cherry, color: 'bg-chart-5/10 text-chart-5 border-chart-5/20' },
}

export function CategoryBadge({ category, label, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category.toLowerCase()] || {
    icon: Shell,
    color: 'bg-muted text-muted-foreground border-border'
  }

  // Usa el label proporcionado (del DB) o capitaliza el slug como fallback
  const displayLabel = label || category.charAt(0).toUpperCase() + category.slice(1)
  const Icon = config.icon

  return (
    <Badge className={`px-2.5 py-1 font-medium shadow-sm border transition-colors hover:brightness-95 ${config.color} ${className || ''}`} variant="secondary">
      <Icon className="mr-1.5 h-3.5 w-3.5 opacity-80" aria-hidden="true" />
      {displayLabel}
    </Badge>
  )
}

