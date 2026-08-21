import { addDays, todayBusinessDate } from '../common/time/business-date.js';

export type AssistantBranchLike = { name: string; slug: string };

export type AssistantQuery =
  | { kind: 'lowRawMaterials'; branch?: string }
  | { kind: 'inventory'; query?: string; branch?: string; prefer?: 'raw' | 'product' }
  | { kind: 'expirations'; branch?: string; fromDate: string; toDate: string; includeExpired: boolean }
  | { kind: 'production'; branch?: string; fromDate: string; toDate: string }
  | { kind: 'dailyClose'; branch?: string; fromDate: string; toDate: string };

export type AssistantDateRange = { fromDate: string; toDate: string };

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export function normalizeAssistantText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function routeAssistantQuery(prompt: string, branches: AssistantBranchLike[]): AssistantQuery | null {
  const normalized = normalizeAssistantText(prompt);
  if (!normalized || isWriteRequest(normalized)) return null;

  const branch = findBranchMention(normalized, branches);
  const dateRange = extractDateRange(normalized);

  if (isExpirationQuestion(normalized)) {
    const includeExpired = /\b(vencid|vencio|caducad|expirad)/.test(normalized);
    const requestedDays = extractRequestedDays(normalized);
    const range = dateRange || {
      fromDate: todayBusinessDate(),
      toDate: addDays(todayBusinessDate(), requestedDays ?? 30),
    };
    return { kind: 'expirations', branch, ...range, includeExpired };
  }

  const productionQuestion = isProductionQuestion(normalized);
  const dailyCloseQuestion = isDailyCloseQuestion(normalized);

  if (productionQuestion && !dailyCloseQuestion) {
    const range = dateRange || singleDayRange();
    return { kind: 'production', branch, ...range };
  }

  if (dailyCloseQuestion && !productionQuestion) {
    const range = dateRange || singleDayRange();
    return { kind: 'dailyClose', branch, ...range };
  }

  if (isLowRawMaterialQuestion(normalized)) {
    return { kind: 'lowRawMaterials', branch };
  }

  if (isInventoryQuestion(normalized)) {
    const query = extractInventoryQuery(prompt, branches);
    const prefer = hasRawMaterialHint(normalized)
      ? 'raw'
      : hasProductHint(normalized)
        ? 'product'
        : undefined;
    return { kind: 'inventory', query, branch, prefer };
  }

  return null;
}

export function extractDateRange(text: string, today = todayBusinessDate()): AssistantDateRange | null {
  const normalized = normalizeAssistantText(text);

  if (/\b(anteayer)\b/.test(normalized)) {
    const date = addDays(today, -2);
    return { fromDate: date, toDate: date };
  }
  if (/\b(ayer)\b/.test(normalized)) {
    const date = addDays(today, -1);
    return { fromDate: date, toDate: date };
  }
  if (/\b(hoy|dia de hoy)\b/.test(normalized)) {
    return { fromDate: today, toDate: today };
  }

  const recentDays = normalized.match(/\b(?:ultimos?|ultimas?|pasados?|pasadas?)\s+(\d{1,3})\s+dias?\b/);
  if (recentDays) {
    const count = Math.max(1, Math.min(366, Number(recentDays[1])));
    return { fromDate: addDays(today, -(count - 1)), toDate: today };
  }

  const explicitDates = extractExplicitDates(normalized);
  if (explicitDates.length > 0) {
    const fromDate = explicitDates[0];
    const toDate = explicitDates[1] || fromDate;
    return fromDate <= toDate
      ? { fromDate, toDate }
      : { fromDate: toDate, toDate: fromDate };
  }

  const monthRange = normalized.match(
    /\b(?:del|entre)\s+(\d{1,2})\s+(?:al|y)\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(20\d{2}))?\b/,
  );
  if (monthRange) {
    const year = Number(monthRange[4] || today.slice(0, 4));
    const fromDate = buildDate(year, MONTHS[monthRange[3]], Number(monthRange[1]));
    const toDate = buildDate(year, MONTHS[monthRange[3]], Number(monthRange[2]));
    if (fromDate && toDate) {
      return fromDate <= toDate ? { fromDate, toDate } : { fromDate: toDate, toDate: fromDate };
    }
  }

  const namedDate = normalized.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(20\d{2}))?\b/,
  );
  if (namedDate) {
    const date = buildDate(Number(namedDate[3] || today.slice(0, 4)), MONTHS[namedDate[2]], Number(namedDate[1]));
    return date ? { fromDate: date, toDate: date } : null;
  }

  if (/\besta semana\b/.test(normalized)) {
    const start = startOfWeek(today);
    return { fromDate: start, toDate: today };
  }
  if (/\bsemana pasada\b/.test(normalized)) {
    const currentStart = startOfWeek(today);
    return { fromDate: addDays(currentStart, -7), toDate: addDays(currentStart, -1) };
  }
  if (/\beste mes\b/.test(normalized)) {
    return { fromDate: `${today.slice(0, 8)}01`, toDate: today };
  }
  if (/\bmes pasado\b/.test(normalized)) {
    const firstOfCurrentMonth = `${today.slice(0, 8)}01`;
    const lastOfPreviousMonth = addDays(firstOfCurrentMonth, -1);
    return { fromDate: `${lastOfPreviousMonth.slice(0, 8)}01`, toDate: lastOfPreviousMonth };
  }

  return null;
}

function singleDayRange(): AssistantDateRange {
  const today = todayBusinessDate();
  return { fromDate: today, toDate: today };
}

function isWriteRequest(value: string): boolean {
  return /\b(registrar|registra|agregar|agrega|crear|crea|actualizar|actualiza|eliminar|elimina|borrar|borra|descontar|mover|mueve|transferir|transfiere|comprar|compra|producir|produce|modificar|modifica)\b/.test(value)
    && !/\b(que se produjo|que produccion|produccion de|produjo|produccion registrada)\b/.test(value);
}

function isExpirationQuestion(value: string): boolean {
  return /\b(caduc|venc|expir|proximos? a vencer|proximas? a vencer|fecha de venc)/.test(value);
}

function isProductionQuestion(value: string): boolean {
  return /\b(produccion|produccion|produjo|producido|horne|amasijo|amasijos|fabric)/.test(value)
    && !/\b(materia prima|insumo|inventario|stock)\b/.test(value);
}

function isDailyCloseQuestion(value: string): boolean {
  return /\b(cierre|cerro|cerrado|conciliacion|conciliado|merma|sobrante|ventas? del dia)\b/.test(value);
}

function isLowRawMaterialQuestion(value: string): boolean {
  return /\b(materia prima|materias primas|insumo|insumos)\b/.test(value)
    && /\b(baj|minim|agot|falt|reabaste|crit|escas)/.test(value);
}

function isInventoryQuestion(value: string): boolean {
  return /\b(inventario|existencia|existencias|stock|queda|quedan|hay|tengo|disponible|disponibles|cuanto|cuanta|cuantos|cuantas|cantidad)\b/.test(value)
    || hasRawMaterialHint(value)
    || hasProductHint(value);
}

function hasRawMaterialHint(value: string): boolean {
  return /\b(materia prima|materias primas|insumo|insumos|azucar|harina|levadura|manteca|sal|huevo|huevos|grasa|aceite|agua)\b/.test(value);
}

function hasProductHint(value: string): boolean {
  return /\b(producto|productos|pan|panes|jugo|jugos|galleta|galletas|coca cola|cocacola|sopa|sopas)\b/.test(value);
}

function findBranchMention(value: string, branches: AssistantBranchLike[]): string | undefined {
  const sorted = [...branches].sort((a, b) => Math.max(b.name.length, b.slug.length) - Math.max(a.name.length, a.slug.length));
  for (const branch of sorted) {
    const name = normalizeAssistantText(branch.name);
    const slug = normalizeAssistantText(branch.slug);
    if ((name.length > 2 && value.includes(name)) || (slug.length > 2 && value.includes(slug))) return branch.slug;
  }
  return undefined;
}

function extractInventoryQuery(prompt: string, branches: AssistantBranchLike[]): string | undefined {
  let text = prompt;
  for (const branch of branches) {
    const variants = [branch.name, branch.slug].filter(Boolean).sort((a, b) => b.length - a.length);
    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`\\b(?:sucursal\\s+)?${escaped}\\b`, 'giu'), ' ');
    }
  }

  const match = text.match(
    /(?:inventario|stock|existencia[s]?)\s+(?:(?:hay|queda[n]?)\s+)?(?:de\s+|del\s+|de la\s+)?(.+?)(?=\s+(?:en|por|de la sucursal|sucursal)\b|[?.!,]|$)/iu,
  ) || text.match(
    /(?:cu[aá]nt[oa]s?|cantidad)\s+(?:de\s+|del\s+|de la\s+)?(.+?)(?=\s+(?:queda[n]?|hay|tengo|disponible[s]?|en|por)\b|[?.!,]|$)/iu,
  ) || text.match(
    /(?:queda[n]?|hay|tengo)\s+(?:de\s+|del\s+|de la\s+)?(.+?)(?=\s+(?:en|por|de la sucursal|sucursal)\b|[?.!,]|$)/iu,
  );

  if (!match?.[1]) return undefined;
  const candidate = match[1]
    .replace(/\b(materia prima|materias primas|insumo|insumos|producto|productos|inventario|stock|existencia|existencias)\b/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return candidate.length >= 2 ? candidate.slice(0, 80) : undefined;
}

function extractRequestedDays(value: string): number | undefined {
  const match = value.match(/\b(?:proxim[oa]s?|dentro de|siguientes?)\s+(\d{1,3})\s+dias?\b/);
  if (!match) return undefined;
  return Math.max(1, Math.min(365, Number(match[1])));
}

function extractExplicitDates(value: string): string[] {
  const dates: string[] = [];
  for (const match of value.matchAll(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/g)) {
    const date = buildDate(Number(match[1]), Number(match[2]), Number(match[3]));
    if (date) dates.push(date);
  }
  for (const match of value.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/g)) {
    const date = buildDate(Number(match[3]), Number(match[2]), Number(match[1]));
    if (date) dates.push(date);
  }
  return [...new Set(dates)].slice(0, 2);
}

function buildDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

function startOfWeek(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return addDays(dateKey, -daysFromMonday);
}
