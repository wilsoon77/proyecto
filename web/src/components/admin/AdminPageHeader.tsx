"use client"

import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface AdminPageHeaderAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: LucideIcon | React.ReactNode
  disabled?: boolean
  variant?: "primary" | "outline" | "ghost"
}

export interface AdminPageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon | React.ReactNode
  action?: AdminPageHeaderAction
  primaryAction?: AdminPageHeaderAction
  secondaryAction?: AdminPageHeaderAction
  breadcrumbs?: Array<{ label: string; href?: string }>
  children?: React.ReactNode
}

function renderActionIcon(icon?: LucideIcon | React.ReactNode) {
  if (!icon) return null
  if (React.isValidElement(icon)) return icon
  const IconComp = icon as React.ComponentType<{ className?: string }>
  return <IconComp className="h-4 w-4 shrink-0" />
}

function renderActionButton(act: AdminPageHeaderAction, isPrimary = true) {
  const iconNode = renderActionIcon(act.icon)
  const isOutline = act.variant === "outline" || (!isPrimary && act.variant !== "primary")

  const buttonClasses = isOutline
    ? "w-full sm:w-auto h-11 px-4 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold rounded-xl shadow-xs text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
    : "w-full sm:w-auto h-11 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"

  if (act.href) {
    return (
      <Link key={act.label} href={act.href} className="w-full sm:w-auto">
        <Button
          variant={isOutline ? "outline" : "default"}
          disabled={act.disabled}
          className={buttonClasses}
        >
          {iconNode}
          <span>{act.label}</span>
        </Button>
      </Link>
    )
  }

  return (
    <Button
      key={act.label}
      type="button"
      variant={isOutline ? "outline" : "default"}
      onClick={act.onClick}
      disabled={act.disabled}
      className={buttonClasses}
    >
      {iconNode}
      <span>{act.label}</span>
    </Button>
  )
}

export function AdminPageHeader({
  title,
  description,
  icon,
  action,
  primaryAction,
  secondaryAction,
  breadcrumbs,
  children,
}: AdminPageHeaderProps) {
  const effectivePrimary = primaryAction || action

  return (
    <div className="space-y-3 mb-6">
      {/* Breadcrumbs si existen */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-[#8C522B]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-[#DECDBB]">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-[#2B170F] transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-bold text-[#2B170F]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B170F] flex items-center gap-3">
            {icon && (
              <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] border border-[#ECCDB5] shrink-0">
                {React.isValidElement(icon)
                  ? icon
                  : React.createElement(icon as React.ComponentType<{ className?: string }>, {
                      className: "h-5 w-5 sm:h-6 sm:w-6",
                    })}
              </span>
            )}
            <span>{title}</span>
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#6E5545] mt-1 font-normal max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Acciones principales / Botones CTA */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {children}
          {secondaryAction && renderActionButton(secondaryAction, false)}
          {effectivePrimary && renderActionButton(effectivePrimary, true)}
        </div>
      </div>
    </div>
  )
}
