"use client"

import * as React from "react"

export interface AdminEntityMetaItem {
  label: string
  value: React.ReactNode
  alert?: boolean
  highlight?: boolean
}

export interface AdminEntityCardProps {
  image?: React.ReactNode
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  badges?: React.ReactNode
  meta?: AdminEntityMetaItem[]
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  dimmed?: boolean
}

export function AdminEntityCard({
  image,
  title,
  subtitle,
  badges,
  meta,
  children,
  actions,
  className = "",
  dimmed = false,
}: AdminEntityCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8DCCB] shadow-xs hover:border-[#D97706]/40 transition-all duration-200 overflow-hidden flex flex-col ${
        dimmed ? "opacity-75 bg-[#FAF5EE]/40" : ""
      } ${className}`}
    >
      {/* ── ZONA 1: Identidad y Estado ── */}
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {image && (
          <div className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center">
            {image}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {typeof title === "string" ? (
              <h3 className="font-bold text-sm sm:text-base text-[#2B170F] truncate" title={title}>
                {title}
              </h3>
            ) : (
              title
            )}
            {badges}
          </div>

          {subtitle && (
            <div className="text-xs text-[#6E5545] font-medium truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* ── ZONA 2: Datos y Métricas Clave ── */}
      {(meta && meta.length > 0) || children ? (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 space-y-3 flex-1">
          {meta && meta.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E8DCCB]/60 text-xs">
              {meta.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#8C522B] tracking-wider">
                    {item.label}
                  </span>
                  <span
                    className={`font-semibold mt-0.5 ${
                      item.alert
                        ? "text-red-700 font-bold"
                        : item.highlight
                        ? "text-[#D97706] font-bold"
                        : "text-[#2B170F]"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* ── ZONA 3: Barra de Acciones Inferior ── */}
      {actions && (
        <div className="border-t border-[#E8DCCB] bg-[#FAF5EE]/50 p-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
