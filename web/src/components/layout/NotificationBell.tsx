"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell, ShoppingCart, TriangleAlert as AlertTriangle, Flame, Shield, Check, Settings, SquareCheck as CheckSquare, Circle } from "lucide-react"
import { useNotifications } from "@/context/NotificationContext"

export default function NotificationBell() {
  const router = useRouter()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    refreshHistory 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      refreshHistory()
    }
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Format relative date
  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Ahora mismo'
      if (diffMins < 60) return `Hace ${diffMins} min`
      
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return `Hace ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`
      
      const diffDays = Math.floor(diffHrs / 24)
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
    } catch {
      return ''
    }
  }

  // Get matching icon and color by category
  const getCategoryDetails = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'ORDERS':
        return {
          icon: ShoppingCart,
          bgColor: 'bg-chart-3/10 border-chart-3/10',
          textColor: 'text-chart-3'
        }
      case 'INVENTORY':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-accent border-primary/10',
          textColor: 'text-primary'
        }
      case 'PRODUCTION':
        return {
          icon: Flame,
          bgColor: 'bg-emerald-50 border-emerald-100',
          textColor: 'text-emerald-600'
        }
      case 'SYSTEM':
      default:
        return {
          icon: Shield,
          bgColor: 'bg-rose-50 border-rose-100',
          textColor: 'text-rose-600'
        }
    }
  }

  // Handle single notification click
  const handleItemClick = async (id: number, url?: string | null, isRead?: boolean) => {
    setIsOpen(false)
    if (!isRead) {
      await markAsRead(id)
    }
    if (url) {
      router.push(url)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with shake animation on hover */}
      <button
        onClick={toggleDropdown}
        className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg relative transition-all duration-200 focus:outline-none group"
        aria-label="Campana de notificaciones"
      >
        <Bell className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive/100 text-[10px] font-bold text-white items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Marcar todo
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/admin/configuracion')
                }}
                className="p-1 text-muted-foreground/60 hover:text-muted-foreground rounded-md transition-colors"
                title="Configuración"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-cream flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Sin notificaciones nuevas</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Te avisaremos cuando ocurra algo importante.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const configCategory = item.type?.split('.')[0] || 'SYSTEM'
                const details = getCategoryDetails(configCategory)
                const IconComponent = details.icon

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id, item.url, item.isRead)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors relative ${
                      item.isRead ? 'hover:bg-cream bg-card' : 'bg-accent/30 hover:bg-accent/50'
                    }`}
                  >
                    {/* Icon Container */}
                    <div className={`h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${details.bgColor} ${details.textColor}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className={`text-xs font-semibold truncate ${item.isRead ? 'text-foreground' : 'text-foreground'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                          {getRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${item.isRead ? 'text-muted-foreground' : 'text-muted-foreground font-medium'}`}>
                        {item.message}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {!item.isRead && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <Circle className="h-2 w-2 text-primary fill-amber-500" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-cream/50 rounded-b-xl text-center">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/admin/configuracion?tab=notificaciones')
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              Ver configuración de alertas
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
