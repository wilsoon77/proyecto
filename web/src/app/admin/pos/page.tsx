"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { ordersService } from "@/lib/api"
import type { ApiProduct } from "@/lib/api/types"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import { useBranches } from "@/hooks/use-branches"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Trash2, Plus, Minus, Search, Store, Cookie, ArrowLeft } from "lucide-react"

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
  const [amountTendered, setAmountTendered] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCartOnMobile, setShowCartOnMobile] = useState(false)

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
      const itemTotal = basePrice * quantity

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

  const isTenderedInsufficient = useMemo(() => {
    if (amountTendered === "") return false
    const tendered = Number(amountTendered)
    return isNaN(tendered) || tendered < cartTotals.total
  }, [amountTendered, cartTotals.total])

  const changeDue = useMemo(() => {
    if (amountTendered === "") return 0
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
        paymentMethod: 'EFECTIVO',
        amountTendered: amountTendered === "" ? cartTotals.total : Number(amountTendered),
        items: cart.map(item => ({
          productSlug: item.product.slug,
          quantity: item.quantity
        }))
      }

      await ordersService.posSale(payload)
      showToast('Venta registrada con éxito', 'success')
      clearCart()
      setAmountTendered("")
      setShowCartOnMobile(false)
      // Refrescar inventario disparando el refetch del hook (React Query auto-invalida)
      refetchProducts()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al procesar la venta'
      showToast(Array.isArray(msg) ? msg[0] : msg, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full min-w-0 flex flex-col lg:flex-row h-[calc(100dvh-64px)] min-h-[calc(100dvh-64px)] overflow-hidden bg-cream">

      {/* LEFT: PRODUCTS LISTING */}
      <div className={`flex-1 min-w-0 min-h-0 flex flex-col h-full border-r border-border ${showCartOnMobile ? 'hidden lg:flex' : 'flex'}`}>

        {/* HEADER: Branches & Search */}
        <div className="p-3 sm:p-4 bg-card border-b flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center shadow-sm z-10 shrink-0">
          <div className="w-full min-w-0 lg:flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Buscar productos (nombre o SKU)..."
              className="pl-9 bg-cream"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full lg:w-auto flex items-center gap-2 min-w-0">
            <Store className="h-5 w-5 text-muted-foreground" />
            <select
              className="w-full lg:w-auto min-w-0 border border-input rounded-md text-sm p-2 bg-card focus:outline-none focus:ring-2 focus:ring-primary"
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
        <div className="bg-card border-b px-2 overflow-x-auto no-scrollbar shadow-sm shrink-0">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === 'ALL' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-foreground hover:bg-border'}`}
            >
              Todos
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === c.slug ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-foreground hover:bg-border'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 bg-cream">
          {!selectedBranch ? (
            <div className="flex h-full items-center justify-center text-muted-foreground/60">
              <p>Selecciona una sucursal para ver los productos</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground/60">
              <p>No se encontraron productos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
              {filteredProducts.map(p => {
                const cartItem = cart.find(item => item.product.id === p.id)
                const qtyInCart = cartItem?.quantity || 0
                const isOutOfStock = p.available === 0

                return (
                  <div
                    key={p.id}
                    className={`
                      relative group min-w-0 bg-card border rounded-xl overflow-hidden shadow-sm transition-all h-full flex flex-col
                      ${isOutOfStock ? 'opacity-50' : qtyInCart > 0 ? 'border-primary/40 ring-1 ring-primary/20 shadow-md' : 'hover:shadow-md hover:border-primary/40 cursor-pointer'}
                    `}
                    onClick={() => { if (!isOutOfStock && qtyInCart === 0) addToCart(p) }}
                  >
                    {/* Stock badge */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-foreground shadow-sm z-10">
                      {p.available !== undefined ? p.available : '∞'}
                    </div>

                    {/* Combo badge */}
                    {p.comboQuantity && p.comboPrice && (
                      <div className="absolute top-2 left-0 bg-chart-3/100 text-white text-[10px] font-bold px-2 py-1 rounded-r-md shadow-sm z-10">
                        {p.comboQuantity} x Q{Number(p.comboPrice).toFixed(2)}
                      </div>
                    )}

                    {/* Cart quantity badge */}
                    {qtyInCart > 0 && (
                      <div className="absolute top-2 left-2 bg-accent0 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10">
                        {qtyInCart}
                      </div>
                    )}

                    <div className="h-24 sm:h-28 bg-muted flex items-center justify-center">
                      {p.images?.[0] ? (
                        <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Cookie className="h-12 w-12 text-muted-foreground/40 stroke-[1.5]" />
                      )}
                    </div>

                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{p.sku}</p>
                      </div>

                      {/* Price + inline quantity controls */}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                        <span className="text-primary font-bold">Q{Number(p.basePrice).toFixed(2)}</span>

                        {qtyInCart > 0 ? (
                          <div className="flex items-center border border-border rounded-lg bg-cream overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => updateQuantity(p.id, -1)}
                              className="px-1.5 py-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-foreground">{qtyInCart}</span>
                            <button
                              onClick={() => addToCart(p)}
                              className="px-1.5 py-1 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : !isOutOfStock ? (
                          <span className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors font-medium">+ Agregar</span>
                        ) : (
                          <span className="text-xs text-destructive/60 font-medium">Agotado</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Summary Button */}
        {cart.length > 0 && (
          <div className="lg:hidden p-3 bg-card border-t border-border shrink-0">
            <Button
              onClick={() => setShowCartOnMobile(true)}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl flex items-center justify-between px-4 font-bold shadow-lg transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
                <span>Ver Carrito</span>
              </div>
              <span>Q{cartTotals.total.toFixed(2)}</span>
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT: CART & CHECKOUT — fixed responsive basis so it remains visible on desktop */}
      <div className={`w-full lg:w-[340px] xl:w-[380px] 2xl:w-[420px] shrink-0 min-w-0 min-h-0 flex flex-col h-full bg-card border-l shadow-2xl z-20 ${showCartOnMobile ? 'flex' : 'hidden lg:flex'}`}>

        {/* Cart Header */}
        <div className="p-3 sm:p-4 border-b bg-cream flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCartOnMobile(false)}
            className="lg:hidden p-1 mr-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">Orden Actual</h2>
          <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
            {cart.reduce((a, b) => a + b.quantity, 0)} items
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 bg-card relative">
          {cart.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex flex-col gap-2 p-3 bg-cream border border-border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-foreground leading-tight">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Q{Number(item.product.basePrice).toFixed(2)} c/u</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-destructive/60 hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center border rounded-md bg-card">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="px-2 py-1 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="px-2 py-1 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="font-bold text-foreground">
                      Q{(Number(item.product.basePrice) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout Panel */}
        <div className="border-t bg-cream p-3 sm:p-4 shrink-0 overflow-y-auto">

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Q{cartTotals.subtotal.toFixed(2)}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-sm text-success font-medium">
                <span>Descuento (Combos)</span>
                <span>- Q{cartTotals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-foreground border-t border-border border-dashed pt-2 mt-2 pb-1">
              <span>Total a Cobrar</span>
              <span>Q{cartTotals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Efectivo Recibido y Vuelto simplificado */}
          <div className="mb-4 bg-card p-3 rounded-lg border border-border shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-muted-foreground font-medium">Efectivo Recibido (Q)</label>
              {amountTendered !== "" && (
                <button
                  type="button"
                  onClick={() => setAmountTendered("")}
                  className="text-[10px] text-primary hover:text-primary font-bold"
                >
                  Usar Pago Exacto
                </button>
              )}
            </div>
            <Input
              type="number"
              placeholder={`Q${cartTotals.total.toFixed(2)} (Pago Exacto)`}
              className="text-lg font-bold h-10 mb-2 border-input focus-visible:ring-amber-500"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              min={cartTotals.total}
              step="0.01"
            />

            {/* Billetes rápidos */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {[10, 20, 50, 100, 200].map((bill) => (
                <button
                  key={bill}
                  type="button"
                  onClick={() => setAmountTendered(bill.toString())}
                  disabled={bill < cartTotals.total}
                  className={`text-[11px] px-2 py-0.5 rounded border font-medium transition-all ${
                    bill < cartTotals.total
                      ? 'opacity-40 bg-cream text-muted-foreground/60 border-border cursor-not-allowed'
                      : amountTendered === bill.toString()
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-card hover:bg-cream border-border text-foreground'
                  }`}
                >
                  Q{bill}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountTendered("")}
                className={`text-[11px] px-2 py-0.5 rounded border font-medium transition-all ${
                  amountTendered === ""
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-card hover:bg-cream border-border text-foreground'
                }`}
              >
                Exacto
              </button>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Cambio:</span>
              <span className={`font-black text-lg ${isTenderedInsufficient ? 'text-destructive animate-pulse' : 'text-success'}`}>
                {isTenderedInsufficient
                  ? 'Monto insuficiente'
                  : amountTendered === ""
                    ? 'Q0.00 (Pago Exacto)'
                    : `Q${changeDue.toFixed(2)}`}
              </span>
            </div>
          </div>

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
              className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 text-lg font-bold shadow-lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing || isTenderedInsufficient}
            >
              {isProcessing ? 'Procesando...' : `Cobrar Q${cartTotals.total.toFixed(2)}`}
            </Button>
          </div>
        </div>

      </div>

    </div>
  )
}
