"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "./AuthContext"
import { useToast } from "./ToastContext"
import { notificationsService } from "@/lib/api/notifications"
import type { Notification } from "@/lib/api/types"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isSubscribed: boolean
  isLoading: boolean
  permissionState: NotificationPermission | 'unsupported'
  subscribeUser: () => Promise<boolean>
  unsubscribeUser: () => Promise<boolean>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshHistory: () => Promise<void>
  playNotificationSound: (soundType: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth()
  const { show } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default')
  
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const maxSeenIdRef = useRef<number>(0)
  const isFirstLoadRef = useRef<boolean>(true)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Function to synthesize sounds via Web Audio API (E5-G5 suave, E5-C5 alerta, A5-E5-A5 importante)
  const playNotificationSound = useCallback((soundType: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      
      const ctx = new AudioContextClass()
      
      const playNote = (
        freq: number, 
        startTime: number, 
        duration: number, 
        volume: number = 0.1, 
        type: OscillatorType = 'sine'
      ) => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        osc.type = type
        osc.frequency.setValueAtTime(freq, startTime)
        
        // Envelope: smooth attack & decay to prevent clicking
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
        
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        osc.start(startTime)
        osc.stop(startTime + duration)
      }

      const now = ctx.currentTime

      if (soundType === 'suave') {
        // E5-G5 (E5 = 659.25 Hz, G5 = 783.99 Hz)
        playNote(659.25, now, 0.15, 0.08, 'sine')
        playNote(783.99, now + 0.12, 0.25, 0.08, 'sine')
      } else if (soundType === 'alerta') {
        // E5-C5 (E5 = 659.25 Hz, C5 = 523.25 Hz)
        playNote(659.25, now, 0.15, 0.12, 'triangle')
        playNote(523.25, now + 0.15, 0.30, 0.12, 'triangle')
      } else if (soundType === 'importante') {
        // A5-E5-A5 (A5 = 880.00 Hz, E5 = 659.25 Hz)
        playNote(880.00, now, 0.12, 0.15, 'sine')
        playNote(659.25, now + 0.12, 0.12, 0.12, 'sine')
        playNote(880.00, now + 0.24, 0.35, 0.15, 'sine')
      } else {
        // Fallback tone
        playNote(440, now, 0.2, 0.1, 'sine')
      }
    } catch (error) {
      console.warn('Fallo al reproducir el sonido sintetizado:', error)
    }
  }, [])

  // Refresh history and count
  const refreshHistory = useCallback(async () => {
    if (!isLoggedIn) return
    
    try {
      const response = await notificationsService.getHistory(1, 20)
      const countRes = await notificationsService.getUnreadCount()
      
      setNotifications(response.data)
      setUnreadCount(countRes.count)

      // Get maximum notification ID from current batch to track new ones
      const currentIds = response.data.map(n => n.id)
      const currentMaxId = currentIds.length > 0 ? Math.max(...currentIds) : 0

      if (isFirstLoadRef.current) {
        maxSeenIdRef.current = currentMaxId
        isFirstLoadRef.current = false
      } else if (currentMaxId > maxSeenIdRef.current) {
        // Identify notifications that are brand new
        const newNotifications = response.data.filter(n => n.id > maxSeenIdRef.current && !n.isRead)
        
        if (newNotifications.length > 0) {
          // Play the sound for the most severe/recent notification
          const primaryNotification = newNotifications[0]
          const soundType = primaryNotification.metadata?.soundType || 'suave'
          
          playNotificationSound(soundType)

          // Show in-app toasts for new notifications
          newNotifications.forEach(n => {
            show(n.message, { 
              variant: n.metadata?.soundType === 'importante' ? 'error' : 'info',
              duration: 5000 
            })
          })
          
          maxSeenIdRef.current = currentMaxId
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [isLoggedIn, playNotificationSound, show])

  // Mark single as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  // Subscribe current browser to Web Push
  const subscribeUser = useCallback(async (): Promise<boolean> => {
    if (!swRegistrationRef.current || !isLoggedIn) {
      console.warn('No service worker registered or user not logged in.')
      return false
    }

    try {
      // Explicitly request permission first (required for some mobile browsers)
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        setPermissionState(permission)
        if (permission !== 'granted') {
          console.warn('El usuario denegó o ignoró el permiso de notificaciones.')
          return false
        }
      } else if (Notification.permission === 'denied') {
        console.warn('Los permisos de notificación están bloqueados en este navegador.')
        return false
      }
      const { publicKey } = await notificationsService.getVapidPublicKey()
      if (!publicKey) {
        console.error('VAPID public key not found on backend.')
        return false
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey)
      const subscription = await swRegistrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })

      const subJson = subscription.toJSON()
      console.log('✅ Browser subscrito al PushManager con endpoint:', subJson.endpoint?.substring(0, 50) + '...')
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await notificationsService.subscribe({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth
          }
        })
        console.log('✅ Suscripción enviada exitosamente al backend')
        setIsSubscribed(true)
        setPermissionState('granted')
        return true
      }
      console.warn('Suscripción generada pero con datos faltantes', subJson)
      return false
    } catch (error) {
      console.error('❌ Error subscribing browser to Web Push:', error)
      return false
    }
  }, [isLoggedIn])

  // Unsubscribe current browser from Web Push
  const unsubscribeUser = useCallback(async (): Promise<boolean> => {
    if (!swRegistrationRef.current) return false

    try {
      const subscription = await swRegistrationRef.current.pushManager.getSubscription()
      if (subscription) {
        await notificationsService.unsubscribe(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setIsSubscribed(false)
      return true
    } catch (error) {
      console.error('Error unsubscribing browser from Web Push:', error)
      return false
    }
  }, [])

  // Setup Service Worker and initial push check
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Las notificaciones push no están soportadas en este navegador.')
      setPermissionState('unsupported')
      setIsLoading(false)
      return
    }

    setPermissionState(Notification.permission)

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      swRegistrationRef.current = reg
      
      // Check if user is already subscribed
      reg.pushManager.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription)
        setIsLoading(false)
      })
    }).catch((err) => {
      console.error('Service Worker registration failed:', err)
      setIsLoading(false)
    })
  }, [])

  // Auto poll notifications when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      isFirstLoadRef.current = true
      refreshHistory()

      // Poll every 30 seconds
      pollIntervalRef.current = setInterval(() => {
        refreshHistory()
      }, 30000)
    } else {
      setNotifications([])
      setUnreadCount(0)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isLoggedIn, refreshHistory])

  // Remove automatic permission request on login. 
  // It should only be requested on explicit user gesture (e.g. clicking the bell or a button)
  useEffect(() => {
    if (isLoggedIn && !isLoading && Notification.permission === 'granted' && !isSubscribed) {
      // If browser already has permission but no subscription, auto subscribe
      subscribeUser()
    }
  }, [isLoggedIn, isLoading, isSubscribed, subscribeUser])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isSubscribed,
        isLoading,
        permissionState,
        subscribeUser,
        unsubscribeUser,
        markAsRead,
        markAllAsRead,
        refreshHistory,
        playNotificationSound
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  return context
}
