"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

export interface FilterChip {
  id: string
  label: string
  count?: number
  active: boolean
  onClick: () => void
}

export interface AdminSearchBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: (e: React.FormEvent) => void
  placeholder?: string
  chips?: FilterChip[]
  totalCount?: number
  filteredCount?: number
  entityName?: string
  children?: React.ReactNode
  isLoading?: boolean
  className?: string
}

export function AdminSearchBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  placeholder = "Buscar...",
  chips,
  totalCount,
  filteredCount,
  entityName = "elementos",
  children,
  isLoading = false,
  className = "",
}: AdminSearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchSubmit) {
      onSearchSubmit(e)
    }
  }

  const showCount = totalCount !== undefined || filteredCount !== undefined

  return (
    <div className={`bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-4 space-y-3 ${className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Input de Búsqueda */}
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 h-11 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C522B] hover:text-[#2B170F] transition-colors rounded-lg"
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Controles extra / Dropdowns secundarios */}
        {children && (
          <div className="flex flex-wrap items-center gap-2">
            {children}
          </div>
        )}
      </div>

      {/* Píldoras / Chips de Estado y Contador */}
      {(chips && chips.length > 0) || showCount ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-[#FAF0E6]">
          {/* Chips scrolleables */}
          {chips && chips.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onClick}
                  className={`h-9 px-3.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    chip.active
                      ? "bg-[#D97706] text-white shadow-2xs"
                      : "bg-[#FAF5EE] text-[#6E5545] hover:bg-[#F3E9DC] hover:text-[#2B170F] border border-[#DECDBB]"
                  }`}
                >
                  <span>{chip.label}</span>
                  {chip.count !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        chip.active
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#8C522B] border border-[#DECDBB]"
                      }`}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Contador humano de resultados */}
          {showCount && (
            <div className="text-xs font-medium text-[#8C522B] shrink-0 self-end sm:self-center">
              {filteredCount !== undefined && totalCount !== undefined ? (
                <span>
                  Mostrando <strong className="text-[#2B170F] font-bold">{filteredCount}</strong> de{" "}
                  <strong className="text-[#2B170F] font-bold">{totalCount}</strong> {entityName}
                </span>
              ) : (
                <span>
                  Total: <strong className="text-[#2B170F] font-bold">{totalCount ?? filteredCount}</strong> {entityName}
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
