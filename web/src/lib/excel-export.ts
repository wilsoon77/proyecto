import ExcelJS from "exceljs"

export interface OperationalReportData {
  branchName: string
  periodLabel: string
  dateRange: { from: string; to: string }
  hideInactiveDays?: boolean
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

export async function exportOperationalReportToExcel(data: OperationalReportData): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Panaderia Svetlana"
  workbook.created = new Date()

  const generationTimestamp = new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Estilos Comunes
  const fontFamily = "Calibri"
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFDECDBB" } },
    bottom: { style: "thin", color: { argb: "FFDECDBB" } },
    left: { style: "thin", color: { argb: "FFDECDBB" } },
    right: { style: "thin", color: { argb: "FFDECDBB" } },
  }
  const borderDoubleBottom: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF9A3412" } },
    bottom: { style: "double", color: { argb: "FF9A3412" } },
    left: { style: "thin", color: { argb: "FFDECDBB" } },
    right: { style: "thin", color: { argb: "FFDECDBB" } },
  }

  // Filtrar dias sin actividad si el flag esta activo
  const filteredActivity = data.hideInactiveDays !== false
    ? data.activity.filter(
        (a) => a.produced > 0 || a.sold > 0 || a.waste > 0 || (a.revenue !== undefined && a.revenue > 0)
      )
    : data.activity

  // =========================================================================
  // HOJA 1: RESUMEN GENERAL Y DETALLE DIARIO
  // =========================================================================
  const ws1 = workbook.addWorksheet("Resumen General", {
    views: [{ showGridLines: true }],
  })

  // Columnas Hoja 1
  ws1.columns = [
    { key: "c1", width: 15 },
    { key: "c2", width: 20 },
    { key: "c3", width: 20 },
    { key: "c4", width: 18 },
    { key: "c5", width: 18 },
    { key: "c6", width: 18 },
    { key: "c7", width: 14 },
    { key: "c8", width: 22 },
  ]

  // Fila 1: Banner Principal
  ws1.mergeCells("A1:H1")
  const bannerCell = ws1.getCell("A1")
  bannerCell.value = "PANADERIA SVETLANA — REPORTE OPERATIVO Y FINANCIERO"
  bannerCell.font = { name: fontFamily, size: 14, bold: true, color: { argb: "FFFFFFFF" } }
  bannerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B170F" } }
  bannerCell.alignment = { vertical: "middle", horizontal: "center" }
  ws1.getRow(1).height = 36

  // Fila 2-4: Metadatos
  const metaStyle = { font: { name: fontFamily, size: 10, color: { argb: "FF5C3D2E" } } }
  ws1.mergeCells("A2:H2")
  ws1.getCell("A2").value = `Sucursal: ${data.branchName}  |  Periodo: ${data.periodLabel} (${data.dateRange.from} al ${data.dateRange.to})`
  ws1.getCell("A2").font = metaStyle.font
  ws1.getCell("A2").alignment = { vertical: "middle", horizontal: "left" }

  ws1.mergeCells("A3:H3")
  ws1.getCell("A3").value = `Fecha de emision: ${generationTimestamp}  |  Filtro dias sin actividad: ${data.hideInactiveDays !== false ? "Omitidos" : "Incluidos"}`
  ws1.getCell("A3").font = metaStyle.font
  ws1.getCell("A3").alignment = { vertical: "middle", horizontal: "left" }

  // Fila 5: Titulo Resumen Ejecutivo
  ws1.mergeCells("A5:C5")
  const execTitle = ws1.getCell("A5")
  execTitle.value = "INDICADORES CLAVE DEL PERIODO"
  execTitle.font = { name: fontFamily, size: 11, bold: true, color: { argb: "FFFFFFFF" } }
  execTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9A3412" } }
  execTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  ws1.getRow(5).height = 24

  // KPIs Rows
  const kpiData = [
    { label: "Total Horneado / Producido", val: data.totals.produced, fmt: "#,##0 piezas" },
    { label: "Total Ventas en Mostrador", val: data.totals.sold, fmt: "#,##0 piezas" },
    { label: "Total Sobrante para Siguiente Turno", val: data.totals.surplus, fmt: "#,##0 piezas" },
    { label: "Total Merma / Descarte Fisico", val: data.totals.waste, fmt: "#,##0 piezas" },
    {
      label: "Indice de Merma General",
      val: data.totals.produced > 0 ? data.totals.waste / data.totals.produced : 0,
      fmt: "0.0%",
    },
    { label: "Recaudacion Total Estimada", val: data.totals.totalRevenue, fmt: '"Q "#,##0.00' },
  ]

  kpiData.forEach((kpi, idx) => {
    const rowNum = 6 + idx
    const row = ws1.getRow(rowNum)
    row.height = 20

    const cellA = ws1.getCell(`A${rowNum}`)
    cellA.value = kpi.label
    cellA.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FF2B170F" } }
    cellA.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: idx % 2 === 0 ? "FFFAF5EE" : "FFFFFFFF" },
    }
    cellA.border = borderThin

    const cellB = ws1.getCell(`B${rowNum}`)
    cellB.value = kpi.val
    cellB.numFmt = kpi.fmt
    cellB.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FF9A3412" } }
    cellB.alignment = { horizontal: "right" }
    cellB.fill = cellA.fill
    cellB.border = borderThin

    const cellC = ws1.getCell(`C${rowNum}`)
    cellC.value = idx === 5 ? "Quetzales (Q)" : idx === 4 ? "Tasa descarte" : "Unidades"
    cellC.font = { name: fontFamily, size: 9, italic: true, color: { argb: "FF6E5545" } }
    cellC.fill = cellA.fill
    cellC.border = borderThin
  })

  // Fila 13: Titulo Tabla Detalle
  const tableTitleRow = 13
  ws1.mergeCells(`A${tableTitleRow}:H${tableTitleRow}`)
  const detailTitle = ws1.getCell(`A${tableTitleRow}`)
  detailTitle.value = "DETALLE DIARIO DE OPERACIONES"
  detailTitle.font = { name: fontFamily, size: 11, bold: true, color: { argb: "FFFFFFFF" } }
  detailTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B170F" } }
  detailTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  ws1.getRow(tableTitleRow).height = 24

  // Fila 14: Encabezados de Columna
  const headerRow = ws1.getRow(14)
  headerRow.height = 26
  const headers = [
    "Fecha",
    "Dia",
    "Horneado (piezas)",
    "Ventas (piezas)",
    "Sobrante (piezas)",
    "Merma (piezas)",
    "% Merma",
    "Ingresos Estimados",
  ]

  headers.forEach((h, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1)
    cell.value = h
    cell.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9A3412" } }
    cell.alignment = { vertical: "middle", horizontal: colIdx >= 2 ? "right" : "left" }
    cell.border = borderThin
  })

  // Filas de Datos de Actividad Diaria
  let currentRow = 15
  filteredActivity.forEach((day, idx) => {
    const row = ws1.getRow(currentRow)
    row.height = 20
    const dayName = getDayName(day.date)
    const daySurplus = Math.max(0, day.produced - day.sold - day.waste)
    const dayWasteRatio = day.produced > 0 ? day.waste / day.produced : 0
    const dayRevenue = day.revenue !== undefined ? day.revenue : day.sold * 0.85
    const isZebra = idx % 2 === 1
    const bgArgb = isZebra ? "FFFAF5EE" : "FFFFFFFF"

    const c1 = row.getCell(1)
    c1.value = day.date
    c1.alignment = { horizontal: "center" }

    const c2 = row.getCell(2)
    c2.value = dayName.charAt(0).toUpperCase() + dayName.slice(1)

    const c3 = row.getCell(3)
    c3.value = day.produced
    c3.numFmt = "#,##0"

    const c4 = row.getCell(4)
    c4.value = day.sold
    c4.numFmt = "#,##0"

    const c5 = row.getCell(5)
    c5.value = daySurplus
    c5.numFmt = "#,##0"

    const c6 = row.getCell(6)
    c6.value = day.waste
    c6.numFmt = "#,##0"

    const c7 = row.getCell(7)
    c7.value = dayWasteRatio
    c7.numFmt = "0.0%"

    const c8 = row.getCell(8)
    c8.value = Number(dayRevenue.toFixed(2))
    c8.numFmt = '"Q "#,##0.00'
    c8.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FF166534" } }

    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c)
      if (c !== 8) {
        cell.font = { name: fontFamily, size: 10, color: { argb: "FF2B170F" } }
      }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } }
      cell.border = borderThin
      if (c >= 3 && c <= 8) {
        cell.alignment = { horizontal: "right" }
      }
    }

    currentRow++
  })

  // Fila de Totales
  const totalRow = ws1.getRow(currentRow)
  totalRow.height = 24
  totalRow.getCell(1).value = "TOTALES"
  totalRow.getCell(2).value = `${filteredActivity.length} dias reportados`
  totalRow.getCell(3).value = data.totals.produced
  totalRow.getCell(3).numFmt = "#,##0"
  totalRow.getCell(4).value = data.totals.sold
  totalRow.getCell(4).numFmt = "#,##0"
  totalRow.getCell(5).value = data.totals.surplus
  totalRow.getCell(5).numFmt = "#,##0"
  totalRow.getCell(6).value = data.totals.waste
  totalRow.getCell(6).numFmt = "#,##0"
  totalRow.getCell(7).value = data.totals.produced > 0 ? data.totals.waste / data.totals.produced : 0
  totalRow.getCell(7).numFmt = "0.0%"
  totalRow.getCell(8).value = Number(data.totals.totalRevenue.toFixed(2))
  totalRow.getCell(8).numFmt = '"Q "#,##0.00'

  for (let c = 1; c <= 8; c++) {
    const cell = totalRow.getCell(c)
    cell.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FF2B170F" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
    cell.border = borderDoubleBottom
    if (c >= 3 && c <= 8) {
      cell.alignment = { horizontal: "right" }
    }
  }

  // =========================================================================
  // HOJA 2: DESGLOSE POR PRODUCTO (Si esta disponible)
  // =========================================================================
  if (data.breakdownItems && data.breakdownItems.length > 0) {
    const ws2 = workbook.addWorksheet("Productos y Ventas", {
      views: [{ showGridLines: true }],
    })

    ws2.columns = [
      { key: "p1", width: 28 },
      { key: "p2", width: 16 },
      { key: "p3", width: 18 },
      { key: "p4", width: 16 },
      { key: "p5", width: 16 },
      { key: "p6", width: 16 },
      { key: "p7", width: 18 },
      { key: "p8", width: 22 },
    ]

    // Banner Hoja 2
    ws2.mergeCells("A1:H1")
    const b2 = ws2.getCell("A1")
    b2.value = "DESGLOSE DE VENTAS Y HORNEADO POR VARIEDAD DE PRODUCTO"
    b2.font = { name: fontFamily, size: 13, bold: true, color: { argb: "FFFFFFFF" } }
    b2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B170F" } }
    b2.alignment = { vertical: "middle", horizontal: "center" }
    ws2.getRow(1).height = 32

    ws2.mergeCells("A2:H2")
    ws2.getCell("A2").value = `Fecha de corte: ${data.breakdownDate || data.dateRange.to}  |  Sucursal: ${data.branchName}`
    ws2.getCell("A2").font = metaStyle.font
    ws2.getCell("A2").alignment = { vertical: "middle", horizontal: "left" }

    // Encabezados Hoja 2
    const h2Row = ws2.getRow(4)
    h2Row.height = 24
    const prodHeaders = [
      "Producto",
      "Categoria",
      "Horneado (piezas)",
      "Ventas (piezas)",
      "Merma (piezas)",
      "Sobrante (piezas)",
      "Precio Unitario",
      "Recaudacion Total",
    ]

    prodHeaders.forEach((ph, colIdx) => {
      const cell = h2Row.getCell(colIdx + 1)
      cell.value = ph
      cell.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9A3412" } }
      cell.alignment = { vertical: "middle", horizontal: colIdx >= 2 ? "right" : "left" }
      cell.border = borderThin
    })

    let r2 = 5
    let totProd = 0, totSold = 0, totWaste = 0, totSurplus = 0, totRev = 0

    data.breakdownItems.forEach((item, idx) => {
      totProd += item.produced
      totSold += item.sold
      totWaste += item.waste
      totSurplus += item.surplus
      totRev += item.revenue

      const row = ws2.getRow(r2)
      row.height = 20
      const isZebra = idx % 2 === 1
      const bgArgb = isZebra ? "FFFAF5EE" : "FFFFFFFF"

      row.getCell(1).value = item.productName
      row.getCell(2).value = item.categoryName || "General"
      row.getCell(3).value = item.produced
      row.getCell(3).numFmt = "#,##0"
      row.getCell(4).value = item.sold
      row.getCell(4).numFmt = "#,##0"
      row.getCell(5).value = item.waste
      row.getCell(5).numFmt = "#,##0"
      row.getCell(6).value = item.surplus
      row.getCell(6).numFmt = "#,##0"
      row.getCell(7).value = item.price
      row.getCell(7).numFmt = '"Q "#,##0.00'
      row.getCell(8).value = Number(item.revenue.toFixed(2))
      row.getCell(8).numFmt = '"Q "#,##0.00'

      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c)
        cell.font = { name: fontFamily, size: 10, color: { argb: "FF2B170F" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } }
        cell.border = borderThin
        if (c >= 3) cell.alignment = { horizontal: "right" }
      }
      r2++
    })

    // Totales Hoja 2
    const totRow2 = ws2.getRow(r2)
    totRow2.height = 24
    totRow2.getCell(1).value = "TOTALES"
    totRow2.getCell(2).value = `${data.breakdownItems.length} variedades`
    totRow2.getCell(3).value = totProd
    totRow2.getCell(3).numFmt = "#,##0"
    totRow2.getCell(4).value = totSold
    totRow2.getCell(4).numFmt = "#,##0"
    totRow2.getCell(5).value = totWaste
    totRow2.getCell(5).numFmt = "#,##0"
    totRow2.getCell(6).value = totSurplus
    totRow2.getCell(6).numFmt = "#,##0"
    totRow2.getCell(7).value = "-"
    totRow2.getCell(8).value = Number(totRev.toFixed(2))
    totRow2.getCell(8).numFmt = '"Q "#,##0.00'

    for (let c = 1; c <= 8; c++) {
      const cell = totRow2.getCell(c)
      cell.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FF2B170F" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
      cell.border = borderDoubleBottom
      if (c >= 3) cell.alignment = { horizontal: "right" }
    }
  }

  // =========================================================================
  // HOJA 3: MATERIAS PRIMAS E INSUMOS
  // =========================================================================
  if (data.rawMaterials && data.rawMaterials.length > 0) {
    const ws3 = workbook.addWorksheet("Materias Primas", {
      views: [{ showGridLines: true }],
    })

    ws3.columns = [
      { key: "m1", width: 32 },
      { key: "m2", width: 18 },
      { key: "m3", width: 18 },
      { key: "m4", width: 18 },
      { key: "m5", width: 28 },
    ]

    // Banner Hoja 3
    ws3.mergeCells("A1:E1")
    const b3 = ws3.getCell("A1")
    b3.value = "ESTADO DE INVENTARIO DE MATERIAS PRIMAS"
    b3.font = { name: fontFamily, size: 13, bold: true, color: { argb: "FFFFFFFF" } }
    b3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B170F" } }
    b3.alignment = { vertical: "middle", horizontal: "center" }
    ws3.getRow(1).height = 32

    ws3.mergeCells("A2:E2")
    ws3.getCell("A2").value = `Fecha de corte: ${generationTimestamp}  |  Sucursal: ${data.branchName}`
    ws3.getCell("A2").font = metaStyle.font

    // Encabezados Hoja 3
    const h3Row = ws3.getRow(4)
    h3Row.height = 24
    const matHeaders = [
      "Insumo / Materia Prima",
      "Stock Actual",
      "Unidad de Medida",
      "Stock Minimo",
      "Estado de Abastecimiento",
    ]

    matHeaders.forEach((mh, colIdx) => {
      const cell = h3Row.getCell(colIdx + 1)
      cell.value = mh
      cell.font = { name: fontFamily, size: 10, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9A3412" } }
      cell.alignment = { vertical: "middle", horizontal: colIdx === 1 || colIdx === 3 ? "right" : "left" }
      cell.border = borderThin
    })

    let r3 = 5
    data.rawMaterials.forEach((rm, idx) => {
      const row = ws3.getRow(r3)
      row.height = 20
      const isZebra = idx % 2 === 1
      const bgArgb = isZebra ? "FFFAF5EE" : "FFFFFFFF"

      row.getCell(1).value = rm.name
      row.getCell(2).value = rm.currentStock
      row.getCell(2).numFmt = "#,##0"
      row.getCell(2).alignment = { horizontal: "right" }
      row.getCell(3).value = rm.unit
      row.getCell(4).value = rm.minimumStock
      row.getCell(4).numFmt = "#,##0"
      row.getCell(4).alignment = { horizontal: "right" }

      const statusCell = row.getCell(5)
      statusCell.value = rm.isLow ? "ALERTA: STOCK BAJO" : "OPTIMO"
      statusCell.alignment = { horizontal: "center" }
      statusCell.font = {
        name: fontFamily,
        size: 10,
        bold: true,
        color: { argb: rm.isLow ? "FF991B1B" : "FF166534" },
      }
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rm.isLow ? "FFFEE2E2" : "FFDCFCE7" },
      }

      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c)
        cell.font = { name: fontFamily, size: 10, color: { argb: "FF2B170F" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } }
        cell.border = borderThin
      }
      statusCell.border = borderThin
      r3++
    })
  }

  // Generar archivo en el navegador
  const cleanBranch = data.branchName.replace(/[^a-zA-Z0-9]/g, "_")
  const fileName = `Reporte_Panaderia_${cleanBranch}_${data.dateRange.from}_a_${data.dateRange.to}.xlsx`

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.URL.revokeObjectURL(url)
}
