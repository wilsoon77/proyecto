import type { AssistantQuery } from './assistant-query.js';

const numberFormatter = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat('es-GT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatAssistantResponse(query: AssistantQuery, result: any): string {
  switch (query.kind) {
    case 'lowRawMaterials':
      return formatLowRawMaterials(result);
    case 'inventory':
      return formatInventory(result);
    case 'expirations':
      return formatExpirations(result);
    case 'production':
      return formatProduction(result);
    case 'dailyClose':
      return formatDailyClose(result);
  }
}

function formatLowRawMaterials(result: any): string {
  if (!result.items?.length) return '✅ Materias primas\nNo hay materias primas por debajo de su mínimo configurado.';

  const lines = ['⚠️ MATERIAS PRIMAS BAJAS', ''];
  for (const item of result.items) {
    lines.push(`• ${item.materialName} — ${quantity(item.quantity, item.unit)} (mínimo ${quantity(item.minimum, item.unit)}) · ${item.branchName}`);
  }
  return limit(lines.join('\n'));
}

function formatInventory(result: any): string {
  if (result.resourceType === 'none' || !result.items?.length) {
    const requested = result.query ? ` “${result.query}”` : '';
    return `🔎 INVENTARIO\nNo encontré información${requested}. Verifica el nombre del producto o materia prima y la sucursal indicada.`;
  }

  const isRaw = result.resourceType === 'rawMaterial';
  const lines = [isRaw ? '📦 INVENTARIO DE MATERIAS PRIMAS' : '📦 INVENTARIO DE PRODUCTOS', ''];
  if (result.query) lines.push(`Consulta: ${result.query}`, '');

  for (const item of result.items) {
    if (isRaw) {
      const lowLabel = item.isLowStock ? ' · ⚠️ BAJO' : '';
      lines.push(`• ${item.materialName}: ${quantity(item.quantity, item.unit)} (mínimo ${item.minimum === null ? 'sin configurar' : quantity(item.minimum, item.unit)})${lowLabel} · ${item.branchName}`);
    } else {
      const unit = item.stockUnitLabel || 'unidades';
      const expiredLabel = item.expiredQuantity > 0 ? ` · ${number(item.expiredQuantity)} vencidas` : '';
      lines.push(`• ${item.productName}: ${number(item.available)} ${unit} disponibles (físico ${number(item.quantity)}, reservadas ${number(item.reserved)})${expiredLabel} · ${item.branchName}`);
    }
  }
  return limit(lines.join('\n'));
}

function formatExpirations(result: any): string {
  const title = result.includeExpired ? '⚠️ PRODUCTOS VENCIDOS' : '⏳ PRODUCTOS PRÓXIMOS A VENCER';
  const lines = [title, `Periodo: ${date(result.fromDate)} al ${date(result.toDate)}`, ''];
  if (!result.items?.length) {
    lines.push(result.includeExpired
      ? '✅ No hay lotes vencidos con existencia registrada en el periodo consultado.'
      : '✅ No hay productos próximos a vencer en el periodo consultado.');
    return lines.join('\n');
  }

  for (const item of result.items) {
    const status = item.daysLeft < 0
      ? `vencido hace ${number(Math.abs(item.daysLeft))} días`
      : item.daysLeft === 0
        ? 'vence hoy'
        : `vence en ${number(item.daysLeft)} días`;
    lines.push(`• ${item.productName} — ${number(item.quantity)} unidades · ${status} (${date(item.expiresAt)}) · ${item.branchName}`);
  }
  return limit(lines.join('\n'));
}

function formatProduction(result: any): string {
  const lines = [
    '🏭 REPORTE DE PRODUCCIÓN',
    `Periodo: ${date(result.fromDate)} al ${date(result.toDate)}`,
    `Total: ${number(result.totalUnits)} unidades · ${number(result.totalTrays)} latas · ${number(result.totalRecords)} registros`,
    '',
  ];
  if (!result.totalRecords) {
    lines.push('No hay producción registrada en el periodo consultado.');
    return lines.join('\n');
  }

  lines.push('Por sucursal:');
  for (const item of result.byBranch || []) {
    lines.push(`• ${item.branchName}: ${number(item.unitsProduced)} unidades · ${number(item.traysProduced)} latas · ${number(item.records)} registros`);
  }

  if ((result.byProduct || []).length > 0) {
    lines.push('', 'Por producto:');
    for (const item of result.byProduct.slice(0, 20)) {
      lines.push(`• ${item.productName}: ${number(item.unitsProduced)} unidades · ${number(item.records)} registros`);
    }
  }

  if ((result.byDay || []).length > 1) {
    lines.push('', 'Detalle por día:');
    for (const item of result.byDay.slice(0, 31)) {
      lines.push(`• ${date(item.date)} · ${item.branchName}: ${number(item.unitsProduced)} unidades`);
    }
  }
  return limit(lines.join('\n'));
}

function formatDailyClose(result: any): string {
  const totals = result.totals || { totalSold: 0, totalWaste: 0, totalSurplus: 0, productsClosed: 0 };
  const lines = [
    '🧾 REPORTE DE CIERRES DIARIOS',
    `Periodo: ${date(result.fromDate)} al ${date(result.toDate)}`,
    `Totales: ${number(totals.totalSold)} vendidos · ${number(totals.totalWaste)} de merma · ${number(totals.totalSurplus)} de sobrante`,
    `Productos conciliados: ${number(totals.productsClosed)} · Cierres registrados: ${number(result.totalCloses || 0)}`,
    '',
  ];
  if (!result.closes?.length) {
    lines.push('No hay cierres registrados en el periodo consultado.');
    return lines.join('\n');
  }

  for (const item of result.closes) {
    lines.push(`• ${date(item.date)} · ${item.branchName}: ${number(item.totalSold)} vendidos · ${number(item.totalWaste)} merma · ${number(item.totalSurplus)} sobrante`);
  }
  return limit(lines.join('\n'));
}

function number(value: unknown): string {
  return numberFormatter.format(Number(value || 0));
}

function quantity(value: unknown, unit?: string | null): string {
  return `${number(value)}${unit ? ` ${unit}` : ''}`;
}

function date(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return String(value || 'fecha no disponible');
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function limit(value: string): string {
  return value.length <= 3800 ? value : `${value.slice(0, 3760).trimEnd()}\n… Hay más resultados. Especifica una sucursal, producto o rango más corto.`;
}
