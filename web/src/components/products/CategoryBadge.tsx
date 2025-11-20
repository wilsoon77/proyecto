import { Badge } from "@/components/ui/badge"

interface CategoryBadgeProps {
  category: string
  className?: string
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  pan: { label: 'Pan', emoji: '🥖', color: 'bg-orange-100 text-orange-800' },
  pasteles: { label: 'Pasteles', emoji: '🎂', color: 'bg-pink-100 text-pink-800' },
  galletas: { label: 'Galletas', emoji: '🍪', color: 'bg-amber-100 text-amber-800' },
  dulces: { label: 'Dulces', emoji: '🍞', color: 'bg-yellow-100 text-yellow-800' },
  especiales: { label: 'Especiales', emoji: '✨', color: 'bg-purple-100 text-purple-800' },
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category.toLowerCase()] || {
    label: category,
    emoji: '🥐',
    color: 'bg-gray-100 text-gray-800'
  }

  return (
    <Badge className={`${config.color} ${className || ''}`} variant="secondary">
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  )
}
