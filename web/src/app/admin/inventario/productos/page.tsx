"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { 
  Package, 
  RefreshCw, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  ArrowLeftRight,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  inventoryService, 
  branchesService, 
  type InventoryItem 
} from "@/lib/api"
import { formatDateString } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar, type FilterChip } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

interface Branch {
  id: number
  name: string
  slug: string
}

type StockFilter = "all" | "low" | "out"

export default function ProductosInventarioPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")

  // Paginación
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)

  const { showToast } = useToast()

  // Cargar datos
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [inventoryData, branchesData] = await Promise.all([
        inventoryService.list(),
        branchesService.list()
      ])
      setInventory(inventoryData)
      setBranches(branchesData)
      setError(null)
    } catch (err) {
      console.error("Error loading finished products:", err)
      setError("Error al cargar el inventario de productos")
      showToast("Error al cargar los datos del inventario", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrar inventario
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (selectedBranch !== "all" && item.branch.slug !== selectedBranch) {
        return false
      }
      if (stockFilter === "low" && (item.available >= 10 || item.available === 0)) {
        return false
      }
      if (stockFilter === "out" && item.available > 0) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return item.product.name.toLowerCase().includes(query) ||
               item.branch.name.toLowerCase().includes(query) ||
               item.product.slug.toLowerCase().includes(query)
      }
      return true
    })
  }, [inventory, selectedBranch, stockFilter, searchQuery])

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedBranch, searchQuery, stockFilter])

  // Paginación del inventario
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / ITEMS_PER_PAGE))
  const paginatedInventory = useMemo(() => {
    return filteredInventory.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [filteredInventory, currentPage])

  // Contadores para chips
  const lowStockCount = useMemo(() => {
    return inventory.filter(i => i.available > 0 && i.available < 10).length
  }, [inventory])

  const outOfStockCount = useMemo(() => {
    return inventory.filter(i => i.available === 0).length
  }, [inventory])

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [
      {
        id: "all",
        label: "Todos",
        count: inventory.length,
        active: stockFilter === "all",
        onClick: () => setStockFilter("all"),
      },
    ]

    if (lowStockCount > 0) {
      chips.push({
        id: "low",
        label: "Stock Bajo",
        count: lowStockCount,
        active: stockFilter === "low",
        onClick: () => setStockFilter("low"),
      })
    }

    if (outOfStockCount > 0) {
      chips.push({
        id: "out",
        label: "Agotados",
        count: outOfStockCount,
        active: stockFilter === "out",
        onClick: () => setStockFilter("out"),
      })
    }

    return chips
  }, [inventory.length, lowStockCount, outOfStockCount, stockFilter])

  const formatDate = (dateStr: string) => formatDateString(dateStr, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Productos Terminados"
        description="Existencias en tiempo real de panes, pasteles y repostería por sucursal"
        icon={<Package className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[
          { label: "Inventario", href: "/admin/inventario" },
          { label: "Productos" },
        ]}
        primaryAction={{
          label: "Nuevo Movimiento",
          href: "/admin/inventario/movimiento",
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
        secondaryAction={{
          label: "Actualizar",
          onClick: () => void loadData(),
          icon: <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />,
        }}
      />

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Buscador y Filtros Estandarizados ── */}
      <AdminSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Buscar producto por nombre o sucursal..."
        chips={filterChips}
        totalCount={inventory.length}
        filteredCount={filteredInventory.length}
        entityName="productos"
        isLoading={isLoading}
      >
        {/* Selector de Sucursal */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8C522B] uppercase tracking-wider hidden sm:inline">
            Sucursal:
          </span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.slug}>{branch.name}</option>
            ))}
          </select>
        </div>
      </AdminSearchBar>

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className="py-20 text-center text-[#8C522B]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#D97706] mx-auto mb-3" />
          <p className="text-sm font-semibold">Cargando existencias de productos...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#2B170F] mb-1">
            No se encontraron existencias
          </h3>
          <p className="text-xs text-[#6E5545] max-w-sm mx-auto mb-6">
            Ajusta los filtros o registra una entrada de producción / movimiento de inventario.
          </p>
          <Link href="/admin/inventario/movimiento">
            <Button className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs h-11 px-5">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Vista Móvil: Tarjetas Estandarizadas ── */}
          <div className="md:hidden space-y-4">
            {paginatedInventory.map((item) => {
              const isOutOfStock = item.available === 0
              const isLowStock = item.available > 0 && item.available < 10

              return (
                <AdminEntityCard
                  key={`m-${item.product.id}-${item.branch.id}`}
                  image={
                    <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                  }
                  title={item.product.name}
                  subtitle={item.branch.name}
                  badges={
                    isOutOfStock ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Agotado
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Stock Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        En Stock
                      </span>
                    )
                  }
                  meta={[
                    {
                      label: "Disponible",
                      value: `${item.available} unidades`,
                      alert: isOutOfStock || isLowStock,
                      highlight: !isOutOfStock && !isLowStock,
                    },
                    {
                      label: "Total / Reservado",
                      value: `${item.quantity} (Res: ${item.reserved})`,
                    },
                  ]}
                  actions={
                    <>
                      <Link
                        href={`/admin/inventario/movimiento?producto=${item.product.slug}&sucursal=${item.branch.slug}`}
                        className="flex-1"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-10 px-3.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                        >
                          <ArrowLeftRight className="h-4 w-4 mr-1.5 text-[#8C522B]" />
                          Movimiento
                        </Button>
                      </Link>

                      {item.expiredQuantity ? (
                        <Link
                          href={`/admin/inventario/movimiento?producto=${item.product.slug}&sucursal=${item.branch.slug}&tipo=MERMA`}
                          className="flex-1"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-10 px-3.5 border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Merma ({item.expiredQuantity})
                          </Button>
                        </Link>
                      ) : null}
                    </>
                  }
                />
              )
            })}
          </div>

          {/* ── Vista Desktop: Tabla Limpia ── */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF5EE] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="py-3.5 px-5 text-xs font-bold text-[#8C522B] uppercase tracking-wider">Producto</th>
                    <th className="py-3.5 px-5 text-xs font-bold text-[#8C522B] uppercase tracking-wider">Sucursal</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider">Total</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider hidden lg:table-cell">Reservado</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider">Disponible</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold text-[#8C522B] uppercase tracking-wider hidden xl:table-cell">Actualizado</th>
                    <th className="py-3.5 px-5 text-right text-xs font-bold text-[#8C522B] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]/60">
                  {paginatedInventory.map((item, index) => {
                    const isOutOfStock = item.available === 0
                    const isLowStock = item.available > 0 && item.available < 10

                    return (
                      <tr
                        key={`${item.product.id}-${item.branch.id}`}
                        className={`hover:bg-[#FAF5EE]/50 transition-colors ${
                          index % 2 === 1 ? "bg-[#FAF5EE]/20" : ""
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#2B170F]">{item.product.name}</p>
                              <p className="text-xs text-[#8C522B] font-mono">{item.product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-medium text-[#2B170F]">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FAF0E6] text-[#D97706] border border-[#E8DCCB]">
                            {item.branch.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-medium text-sm text-[#2B170F]">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-5 text-center text-sm font-mono text-[#8C522B] hidden lg:table-cell">
                          {item.reserved}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            isOutOfStock
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {item.available} disp.
                          </span>
                          {item.expiredQuantity ? (
                            <Link
                              href={`/admin/inventario/movimiento?producto=${item.product.slug}&sucursal=${item.branch.slug}&tipo=MERMA`}
                              className="mt-1 block text-[10px] font-bold text-red-600 hover:underline"
                            >
                              {item.expiredQuantity} vencidas · merma
                            </Link>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[#6E5545] font-mono hidden xl:table-cell">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/inventario/movimiento?producto=${item.product.slug}&sucursal=${item.branch.slug}`}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5 mr-1 text-[#8C522B]" />
                              Movimiento
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Paginación Estandarizada ── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl shadow-xs border border-[#E8DCCB] px-6 py-4">
              <p className="text-xs font-semibold text-[#8C522B]">
                Página {currentPage} de {totalPages} ({filteredInventory.length} registros)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold"
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
