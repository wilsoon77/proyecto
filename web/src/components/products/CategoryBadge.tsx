import { Badge } from "@/components/ui/badge"

interface CategoryBadgeProps {
  category: string
  label?: string
  className?: string
}

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  pan: { emoji: '🥖', color: 'bg-orange-100 text-orange-800' },
  pasteles: { emoji: '🎂', color: 'bg-pink-100 text-pink-800' },
  galletas: { emoji: '🍪', color: 'bg-amber-100 text-amber-800' },
  dulces: { emoji: '🍞', color: 'bg-yellow-100 text-yellow-800' },
  especiales: { emoji: '✨', color: 'bg-purple-100 text-purple-800' },
  bebidas: { emoji: '☕', color: 'bg-blue-100 text-blue-800' },
  reposteria: { emoji: '🧁', color: 'bg-rose-100 text-rose-800' },
}

export function CategoryBadge({ category, label, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category.toLowerCase()] || {
    emoji: '🥐',
    color: 'bg-gray-100 text-gray-800'
  }

  // Usa el label proporcionado (del DB) o capitaliza el slug como fallback
  const displayLabel = label || category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <Badge className={`${config.color} ${className || ''}`} variant="secondary">
      <span className="mr-1">{config.emoji}</span>
      {displayLabel}
    </Badge>
  )
}
