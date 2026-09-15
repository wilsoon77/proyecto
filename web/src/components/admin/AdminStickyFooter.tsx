"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface AdminStickyFooterProps {
  primaryLabel?: string
  primaryType?: "button" | "submit"
  onPrimaryClick?: () => void
  isPrimarySubmitting?: boolean
  isPrimaryDisabled?: boolean
  primaryIcon?: React.ElementType
  secondaryLabel?: string
  secondaryHref?: string
  onSecondaryClick?: () => void
  extraActions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function AdminStickyFooter({
  primaryLabel = "Guardar Cambios",
  primaryType = "submit",
  onPrimaryClick,
  isPrimarySubmitting = false,
  isPrimaryDisabled = false,
  primaryIcon: PrimaryIcon = Save,
  secondaryLabel = "Cancelar",
  secondaryHref,
  onSecondaryClick,
  extraActions,
  children,
  className = "",
}: AdminStickyFooterProps) {
  const hasExtra = Boolean(extraActions || children)

  return (
    <div
      className={`sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8DCCB] -mx-4 -mb-4 p-3.5 sm:mx-0 sm:mb-0 sm:rounded-2xl sm:border sm:border-[#E8DCCB] sm:px-6 sm:py-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
    >
      {hasExtra && (
        <div className="flex items-center gap-2">
          {extraActions}
          {children}
        </div>
      )}

      <div className="flex items-center gap-2.5 w-full sm:w-auto ml-auto">
        {/* Botón Secundario (Cancelar) */}
        {secondaryHref ? (
          <Link href={secondaryHref} className="flex-1 sm:flex-initial min-w-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPrimarySubmitting}
              className="w-full sm:w-auto h-11 sm:h-12 px-3.5 sm:px-5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center"
            >
              <X className="h-4 w-4 mr-1.5 shrink-0 text-[#8C522B]" />
              <span className="truncate">{secondaryLabel}</span>
            </Button>
          </Link>
        ) : onSecondaryClick ? (
          <Button
            type="button"
            variant="outline"
            onClick={onSecondaryClick}
            disabled={isPrimarySubmitting}
            className="flex-1 sm:flex-initial min-w-0 w-full sm:w-auto h-11 sm:h-12 px-3.5 sm:px-5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-1.5 shrink-0 text-[#8C522B]" />
            <span className="truncate">{secondaryLabel}</span>
          </Button>
        ) : null}

        {/* Botón Primario (Guardar) */}
        <Button
          type={primaryType}
          onClick={onPrimaryClick}
          disabled={isPrimaryDisabled || isPrimarySubmitting}
          className="flex-1 sm:flex-initial min-w-0 w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-6 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-md text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPrimarySubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span className="truncate">Guardando...</span>
            </>
          ) : (
            <>
              {PrimaryIcon && <PrimaryIcon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{primaryLabel}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
