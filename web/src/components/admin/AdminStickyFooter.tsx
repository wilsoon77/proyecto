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
  return (
    <div
      className={`sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8DCCB] -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 p-4 sm:px-8 sm:py-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        {extraActions}
        {children}
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        {/* Botón Secundario (Cancelar) */}
        {secondaryHref ? (
          <Link href={secondaryHref} className="flex-1 sm:flex-initial">
            <Button
              type="button"
              variant="outline"
              disabled={isPrimarySubmitting}
              className="w-full sm:w-auto h-12 px-5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl font-bold text-sm cursor-pointer"
            >
              <X className="h-4 w-4 mr-1.5 shrink-0 text-[#8C522B]" />
              <span>{secondaryLabel}</span>
            </Button>
          </Link>
        ) : onSecondaryClick ? (
          <Button
            type="button"
            variant="outline"
            onClick={onSecondaryClick}
            disabled={isPrimarySubmitting}
            className="flex-1 sm:flex-initial w-full sm:w-auto h-12 px-5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl font-bold text-sm cursor-pointer"
          >
            <X className="h-4 w-4 mr-1.5 shrink-0 text-[#8C522B]" />
            <span>{secondaryLabel}</span>
          </Button>
        ) : null}

        {/* Botón Primario (Guardar) */}
        <Button
          type={primaryType}
          onClick={onPrimaryClick}
          disabled={isPrimaryDisabled || isPrimarySubmitting}
          className="flex-1 sm:flex-initial w-full sm:w-auto h-12 px-6 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-md text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPrimarySubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              {PrimaryIcon && <PrimaryIcon className="h-4 w-4 shrink-0" />}
              <span>{primaryLabel}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
