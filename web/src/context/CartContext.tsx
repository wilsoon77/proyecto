"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react"
import { Product, CartItem } from "@/types"
import { useToast } from "@/context/ToastContext"

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  total: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const hydrated = useRef(false)
  const { show } = useToast()
  const quantityToastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('cart') : null
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (e) {
      console.warn('No se pudo leer el carrito de localStorage', e)
    } finally {
      hydrated.current = true
    }
  }, [])

  // Persist to localStorage when items change (after hydration)
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem('cart', JSON.stringify(items))
    } catch (e) {
      console.warn('No se pudo guardar el carrito en localStorage', e)
    }
  }, [items])

  // Calcular número de items
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  // Calcular subtotal
  const subtotal = items.reduce((total, item) => {
    const price = item.product.discount
      ? item.product.price * (1 - item.product.discount / 100)
      : item.product.price
    return total + price * item.quantity
  }, 0)

  // Total = subtotal (sistema de reserva, pago al recoger)
  const total = subtotal

  // Agregar producto al carrito (con validación de stock)
  const addItem = useCallback((product: Product, quantity: number = 1) => {
    if (quantity <= 0 || isNaN(quantity)) return

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)
      const currentQty = existingItem ? existingItem.quantity : 0
      const maxStock = product.stock > 0 ? product.stock : Infinity

      // Verificar que no exceda el stock disponible
      if (currentQty + quantity > maxStock) {
        const canAdd = maxStock - currentQty
        if (canAdd <= 0) {
          try { show(`No hay más stock disponible de ${product.name}`, { variant: 'error' }) } catch {}
          return prevItems
        }
        quantity = canAdd
        try { show(`Solo se agregaron ${canAdd} unidades (stock limitado)`, { variant: 'info' }) } catch {}
      }

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prevItems, { product, quantity }]
      }
    })
    try { show(`Agregado: ${product.name} × ${quantity}`, { variant: 'success' }) } catch {}
  }, [show])

  // Remover producto del carrito
  const removeItem = useCallback((productId: number) => {
    const prod = items.find(i => i.product.id === productId)?.product
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
    if (prod) {
      try { show(`Eliminado: ${prod.name}`, { variant: 'error' }) } catch {}
    }
  }, [items, show])

  // Actualizar cantidad de un producto (con validación de stock y NaN)
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    // Sanitizar: NaN o negativo → ignorar
    if (isNaN(quantity) || quantity < 0) return

    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    let prodName: string | undefined
    setItems((prevItems) => {
      const found = prevItems.find(i => i.product.id === productId)
      if (!found) return prevItems
      prodName = found.product.name
      const maxStock = found.product.stock > 0 ? found.product.stock : Infinity
      const clampedQty = Math.min(quantity, maxStock)
      if (clampedQty < quantity) {
        try { show(`Stock máximo: ${maxStock} unidades`, { variant: 'info' }) } catch {}
      }
      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: clampedQty } : item
      )
    })
    // Debounce toast to avoid spamming on rapid clicks
    if (prodName) {
      const existing = quantityToastTimers.current.get(productId)
      if (existing) clearTimeout(existing)
      const t = setTimeout(() => {
        try { show(`Cantidad de ${prodName}: ${quantity}`, { variant: 'info' }) } catch {}
        quantityToastTimers.current.delete(productId)
      }, 500)
      quantityToastTimers.current.set(productId, t)
    }
  }, [removeItem, show])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      quantityToastTimers.current.forEach((t) => clearTimeout(t))
      quantityToastTimers.current.clear()
    }
  }, [])

  // Limpiar carrito
  const clearCart = useCallback(() => {
    if (items.length > 0) {
      try { show('Carrito vaciado', { variant: 'error' }) } catch {}
    }
    setItems([])
  }, [items, show])

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook personalizado para usar el carrito
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider")
  }
  return context
}

