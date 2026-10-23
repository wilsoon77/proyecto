import * as XLSX from "xlsx"

export interface OperationalReportData {
  branchName: string
  periodLabel: string
  dateRange: { from: string; to: string }
  activity: Array<{
    date: string
    produced: number
    sold: number
    waste: number
    revenue?: number
  }>
  totals: {
    produced: number
    sold: number
    waste: number
    surplus: number
    totalRevenue: number
  }
  breakdownItems?: Array<{
    productName: string
    categoryName?: string
    produced: number
    sold: number
    waste: number
    surplus: number
    price: number
    revenue: number
  }>
  breakdownDate?: string | null
  rawMaterials?: Array<{
    name: string
    currentStock: number
    unit: string
    minimumStock: number
    isLow: boolean
  }>
}

function formatCurrency(val: number): string {
  return `Q ${val.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getDayName(isoDate: string): string {
  const parts = isoDate.split("T")[0].split("-")
  if (parts.length !== 3) return ""
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return ""
  const d = new Date(year, month - 1, day, 12, 0, 0)
  return d.toLocaleDateString("es-GT", { weekday: "long" })
}

export function exportOperationalReportToExcel(data: OperationalReportData): void {
  const wb = XLSX.utils.book_new()
  const generationTimestamp = new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // ----------------------------------------------------
  // HOJA 1: RESUMEN OPERATIVO Y VENTAS
  // ----------------------------------------------------
  const sheet1Rows: Array<Array<string | number>> = []

  // Encabezado institucional
  sheet1Rows.push(["PANADERIA SVETLANA — REPORTE OPERATIVO Y FINANCIERO"])
  sheet1Rows.push([`Sucursal: ${data.branchName}`])
  sheet1Rows.push([`Periodo: ${data.periodLabel} (${data.dateRange.from} al ${data.dateRange.to})`])
  sheet1Rows.push([`Fecha y hora de emision: ${generationTimestamp}`])
  sheet1Rows.push([])

  // Resumen Ejecutivo (KPIs)
  sheet1Rows.push(["RESUMEN EJECUTIVO DEL PERIODO"])
  sheet1Rows.push(["Indicador Clave", "Valor", "Unidad / Formato"])
  sheet1Rows.push(["Total Horneado / Producido", data.totals.produced, "piezas"])
  sheet1Rows.push(["Total Ventas en Mostrador", data.totals.sold, "piezas"])
  sheet1Rows.push(["Total Sobrante para Dia Siguiente", data.totals.surplus, "piezas"])
  sheet1Rows.push(["Total Merma / Descarte Fisico", data.totals.waste, "piezas"])
  const wastePercent = data.totals.produced > 0
    ? Number(((data.totals.waste / data.totals.produced) * 100).toFixed(2))
    : 0
  sheet1Rows.push(["Indice de Merma", `${wastePercent}%`, "porcentaje sobre produccion"])
  sheet1Rows.push(["Recaudacion Total Estimada", formatCurrency(data.totals.totalRevenue), "Quetzales (Q)"])
  sheet1Rows.push([])

  // Tabla Detallada Dia a Dia
  sheet1Rows.push(["DETALLE DIARIO DE OPERACIONES"])
  sheet1Rows.push([
    "Fecha",
    "Dia de la semana",
    "Horneado (piezas)",
    "Ventas (piezas)",
    "Sobrante (piezas)",
    "Merma (piezas)",
    "% Merma",
    "Ingresos (Q)",
  ])

  data.activity.forEach((item) => {
    const dayName = getDayName(item.date)
    const daySurplus = Math.max(0, item.produced - item.sold - item.waste)
    const dayWastePct = item.produced > 0
      ? `${((item.waste / item.produced) * 100).toFixed(1)}%`
      : "0.0%"
    const dayRevenue = item.revenue !== undefined ? item.revenue : item.sold * 0.85

    sheet1Rows.push([
      item.date,
      dayName.charAt(0).toUpperCase() + dayName.slice(1),
      item.produced,
      item.sold,
      daySurplus,
      item.waste,
      dayWastePct,
      Number(dayRevenue.toFixed(2)),
    ])
  })

  // Fila de totales diarios
  sheet1Rows.push([
    "TOTALES",
    "-",
    data.totals.produced,
    data.totals.sold,
    data.totals.surplus,
    data.totals.waste,
    `${wastePercent}%`,
    Number(data.totals.totalRevenue.toFixed(2)),
  ])

  const wsSummary = XLSX.utils.aoa_to_sheet(sheet1Rows)
  wsSummary["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen General")

  // ----------------------------------------------------
  // HOJA 2: DESGLOSE POR PRODUCTO (Si esta disponible)
  // ----------------------------------------------------
  if (data.breakdownItems && data.breakdownItems.length > 0) {
    const sheet2Rows: Array<Array<string | number>> = []

    sheet2Rows.push(["DESGLOSE POR PRODUCTO"])
    sheet2Rows.push([`Fecha de analisis: ${data.breakdownDate || data.dateRange.to}`])
    sheet2Rows.push([`Sucursal: ${data.branchName}`])
    sheet2Rows.push([])

    sheet2Rows.push([
      "Producto",
      "Categoria",
      "Horneado (piezas)",
      "Ventas (piezas)",
      "Merma (piezas)",
      "Sobrante (piezas)",
      "Precio Unitario (Q)",
      "Ingresos Totales (Q)",
    ])

    let totalBreakdownProduced = 0
    let totalBreakdownSold = 0
    let totalBreakdownWaste = 0
    let totalBreakdownSurplus = 0
    let totalBreakdownRevenue = 0

    data.breakdownItems.forEach((p) => {
      totalBreakdownProduced += p.produced
      totalBreakdownSold += p.sold
      totalBreakdownWaste += p.waste
      totalBreakdownSurplus += p.surplus
      totalBreakdownRevenue += p.revenue

      sheet2Rows.push([
        p.productName,
        p.categoryName || "General",
        p.produced,
        p.sold,
        p.waste,
        p.surplus,
        Number(p.price.toFixed(2)),
        Number(p.revenue.toFixed(2)),
      ])
    })

    sheet2Rows.push([
      "TOTALES",
      "-",
      totalBreakdownProduced,
      totalBreakdownSold,
      totalBreakdownWaste,
      totalBreakdownSurplus,
      "-",
      Number(totalBreakdownRevenue.toFixed(2)),
    ])

    const wsProducts = XLSX.utils.aoa_to_sheet(sheet2Rows)
    wsProducts["!cols"] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(wb, wsProducts, "Productos y Ventas")
  }

  // ----------------------------------------------------
  // HOJA 3: INVENTARIO DE MATERIAS PRIMAS
  // ----------------------------------------------------
  if (data.rawMaterials && data.rawMaterials.length > 0) {
    const sheet3Rows: Array<Array<string | number>> = []

    sheet3Rows.push(["INVENTARIO DE MATERIAS PRIMAS E INSUMOS"])
    sheet3Rows.push([`Sucursal: ${data.branchName}`])
    sheet3Rows.push([`Fecha de corte: ${generationTimestamp}`])
    sheet3Rows.push([])

    sheet3Rows.push([
      "Insumo / Materia Prima",
      "Stock Actual",
      "Unidad de Medida",
      "Stock Minimo",
      "Estado de Abastecimiento",
    ])

    data.rawMaterials.forEach((rm) => {
      sheet3Rows.push([
        rm.name,
        rm.currentStock,
        rm.unit,
        rm.minimumStock,
        rm.isLow ? "ALERTA: STOCK BAJO" : "OPTIMO",
      ])
    })

    const wsMaterials = XLSX.utils.aoa_to_sheet(sheet3Rows)
    wsMaterials["!cols"] = [
      { wch: 30 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
    ]
    XLSX.utils.book_append_sheet(wb, wsMaterials, "Materias Primas")
  }

  // Sanitizar nombre de archivo para compatibilidad
  const cleanBranch = data.branchName.replace(/[^a-zA-Z0-9]/g, "_")
  const fileName = `Reporte_Panaderia_${cleanBranch}_${data.dateRange.from}_a_${data.dateRange.to}.xlsx`

  XLSX.writeFile(wb, fileName)
}
