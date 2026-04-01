"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { ordersService } from "@/lib/api"
import type { ApiProduct } from "@/lib/api/types"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import { useBranches } from "@/hooks/use-branches"
import { useToast } from "@/components/ui/toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Trash2, Plus, Minus, Search, CreditCard, Banknote, Store } from "lucide-react"

// Types for POS
type CartItem = {
  product: ApiProduct
  quantity: number
}

export default function PosPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  // Data integration using React Query Hooks
  const { categories } = useCategories()
  const { branches } = useBranches()

  // Selection states
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch products automatically using React Query based on selected branch
  const { products, refetch: refetchProducts } = useProducts(
    { branch: selectedBranch, pageSize: 1000 },
    { enabled: !!selectedBranch }
  )

  // Cart & checkout states
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string>("EFECTIVO")
  const [amountTendered, setAmountTendered] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  // When user branch is available, set it as default
  useEffect(() => {
    if (user?.branch?.slug && !selectedBranch) {
      setSelectedBranch(user.branch.slug)
    } else if (branches.length > 0 && !selectedBranch && user?.role === 'ADMIN') {
      setSelectedBranch(branches[0].slug)
    }
  }, [user, branches, selectedBranch])

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Solo activos
      if (!p.isActive || !p.isAvailable) return false
      
      const matchesCategory = selectedCategory === "ALL" || p.categorySlug === selectedCategory
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  // Lógica del Carrito y Combos
  const addToCart = (product: ApiProduct) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        // Validar si supera el stock físico de la sucursal (suponiendo que 'available' viene en el DTO para el branch consultado)
        if (product.available !== undefined && existing.quantity >= product.available) {
          showToast(`Stock máximo alcanzado para ${product.name}`, 'error')
          return prev
        }
        return prev.map(item => item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const result = prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta
          if (item.product.available !== undefined && newQ > item.product.available) {
             showToast(`Stock físico máximo alcanzado`, 'error')
             return item
          }
           return { ...item, quantity: newQ }
        }
        return item
      }).filter(item => item.quantity > 0)
      return result
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearCart = () => setCart([])

  // Totales
  const cartTotals = useMemo(() => {
    let subtotal = 0
    let discount = 0

    cart.forEach(({ product, quantity }) => {
      const basePrice = Number(product.basePrice)
      let itemTotal = basePrice * quantity
      
      // Aplicar combos localmente en frontend para mostrar el total en tiempo real
      if (product.comboQuantity && product.comboPrice && product.comboQuantity > 0) {
        const comboQty = Number(product.comboQuantity)
        const comboPrice = Number(product.comboPrice)
        const nCombos = Math.floor(quantity / comboQty)
        const remainder = quantity % comboQty
        
        const priceWithCombo = (nCombos * comboPrice) + (remainder * basePrice)
        const discountForThisItem = itemTotal - priceWithCombo
        discount += discountForThisItem
      }
      
      subtotal += itemTotal
    })

    return {
      subtotal,
      discount,
      total: subtotal - discount
    }
  }, [cart])

  const changeDue = useMemo(() => {
    const tendered = Number(amountTendered)
    if (isNaN(tendered) || tendered < cartTotals.total) return 0
    return tendered - cartTotals.total
  }, [amountTendered, cartTotals.total])

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!selectedBranch) {
      showToast('Seleccione una sucursal', 'error')
      return
    }
    
    setIsProcessing(true)
    try {
      const payload = {
        branchSlug: selectedBranch,
        paymentMethod: paymentMethod,
        amountTendered: Number(amountTendered) || undefined,
        items: cart.map(item => ({
          productSlug: item.product.slug,
          quantity: item.quantity
        }))
      }
      
      await ordersService.posSale(payload)
      showToast('Venta registrada con éxito', 'success')
      clearCart()
      setAmountTendered("")
      // Refrescar inventario disparando el refetch del hook (React Query auto-invalida)
      refetchProducts()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al procesar la venta'
      showToast(Array.isArray(msg) ? msg[0] : msg, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      
      {/* LEFT: PRODUCTS LISTING */}
      <div className="flex-1 flex flex-col h-full border-r border-gray-200">
        
        {/* HEADER: Branches & Search */}
        <div className="p-4 bg-white border-b flex flex-wrap gap-4 items-center shadow-sm z-10">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar productos (nombre o SKU)..." 
              className="pl-9 bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-gray-500" />
            <select 
              className="border border-gray-300 rounded-md text-sm p-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={user?.role !== 'ADMIN'}
            >
              <option value="" disabled>Seleccione Sucursal</option>
              {branches.map(b => (
                <option key={b.id} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CATEGORIES TABS */}
        <div className="bg-white border-b px-2 overflow-x-auto no-scrollbar shadow-sm">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === 'ALL' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === c.slug ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {!selectedBranch ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <p>Selecciona una sucursal para ver los productos</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <p>No se encontraron productos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  className={`
                    relative group bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col
                    ${p.available === 0 ? 'opacity-50 pointer-events-none' : 'hover:border-amber-400'}
                  `}
                >
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-gray-700 shadow-sm">
                    {p.available !== undefined ? p.available : '∞'}
                  </div>
                  
                  {p.comboQuantity && p.comboPrice && (
                    <div className="absolute top-2 left-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-r-md shadow-sm z-10">
                      {p.comboQuantity} x Q{Number(p.comboPrice).toFixed(2)}
                    </div>
                  )}

                  <div className="h-28 bg-gray-100 flex items-center justify-center">
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-4xl text-gray-300 opacity-50">🥖</div>
                    )}
                  </div>
                  
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{p.sku}</p>
                    </div>
                    <div className="mt-2 text-amber-600 font-bold">
                      Q{Number(p.basePrice).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CART & CHECKOUT (Width: 380px fixed on Desktop) */}
      <div className="w-full lg:w-[380px] flex flex-col h-full bg-white border-l shadow-2xl z-20">
        
        {/* Cart Header */}
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Orden Actual</h2>
          <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
            {cart.reduce((a, b) => a + b.quantity, 0)} items
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 bg-white relative">
          {cart.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-gray-800 leading-tight">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Q{Number(item.product.basePrice).toFixed(2)} c/u</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center border rounded-md bg-white">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="px-2 py-1 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-500"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="px-2 py-1 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-amber-500"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="font-bold text-gray-800">
                       Q{(Number(item.product.basePrice) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout Panel */}
        <div className="border-t bg-gray-50 p-4 shrink-0">
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Q{cartTotals.subtotal.toFixed(2)}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Descuento (Combos)</span>
                <span>- Q{cartTotals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-gray-900 border-t border-gray-200 border-dashed pt-2 mt-2 pb-1">
              <span>Total a Cobrar</span>
              <span>Q{cartTotals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('EFECTIVO')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border-2 transition-all
                ${paymentMethod === 'EFECTIVO' ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <Banknote className="h-5 w-5 mb-1" />
              <span className="text-xs">Efectivo</span>
            </button>
            <button
              onClick={() => setPaymentMethod('TARJETA')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border-2 transition-all
                ${paymentMethod === 'TARJETA' ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Tarjeta</span>
            </button>
          </div>

          {paymentMethod === 'EFECTIVO' && (
             <div className="mb-4 bg-white p-3 rounded-lg border border-gray-200">
               <label className="text-xs text-gray-500 font-medium mb-1 block">Efectivo Recibido (Q)</label>
               <Input 
                 type="number" 
                 placeholder="0.00" 
                 className="text-lg font-medium h-10 mb-2"
                 value={amountTendered}
                 onChange={(e) => setAmountTendered(e.target.value)}
                 min={cartTotals.total}
                 step="0.01"
               />
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Cambio:</span>
                 <span className={`font-bold text-lg ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                   Q{changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}
                 </span>
               </div>
             </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="px-3"
              onClick={clearCart}
              disabled={cart.length === 0 || isProcessing}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-12 text-lg font-bold shadow-lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing || (paymentMethod === 'EFECTIVO' && changeDue < 0)}
            >
              {isProcessing ? 'Procesando...' : `Cobrar Q${cartTotals.total.toFixed(2)}`}
            </Button>
          </div>
        </div>

      </div>

    </div>
  )
}
