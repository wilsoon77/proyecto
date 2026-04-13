import { Badge } from "@/components/ui/badge"
import { Croissant, CakeSlice, Cookie, Candy, Sparkles, Coffee, Cherry, Shell } from "lucide-react"

interface CategoryBadgeProps {
  category: string
  label?: string
  className?: string
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pan: { icon: Croissant, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  pasteles: { icon: CakeSlice, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  galletas: { icon: Cookie, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  dulces: { icon: Candy, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  especiales: { icon: Sparkles, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  bebidas: { icon: Coffee, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  reposteria: { icon: Cherry, color: 'bg-rose-100 text-rose-800 border-rose-200' },
}

export function CategoryBadge({ category, label, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category.toLowerCase()] || {
    icon: Shell,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
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

