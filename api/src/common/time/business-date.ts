export const BUSINESS_TIMEZONE = process.env.STORE_TIMEZONE || 'America/Guatemala';

export const DEFAULT_OPERATING_DAYS = [1, 2, 3, 4, 5, 6] as const;
export type OperatingDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function isOperatingDay(value: number): value is OperatingDay {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

/**
 * Returns the store weekdays that participate in daily operational tracking.
 * JavaScript weekday numbers are used: Sunday=0, Monday=1, ..., Saturday=6.
 * Invalid or empty configuration falls back to Monday-Saturday.
 */
export function getOperatingDays(raw = process.env.STORE_OPERATING_DAYS): OperatingDay[] {
  const configured = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => /^[0-6]$/.test(value))
    .map(Number)
    .filter(isOperatingDay);
  const unique = [...new Set(configured)].sort((a, b) => a - b);
  return unique.length > 0 ? unique : [...DEFAULT_OPERATING_DAYS];
}

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('La fecha debe tener el formato YYYY-MM-DD');
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error('La fecha indicada no es válida');
  }
  return parsed;
}

export function formatBusinessDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function dateKeyToUtcDate(value: string): Date {
  return parseDateOnly(value);
}

function getTimeZoneOffsetMs(value: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(value);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const hour = get('hour') === 24 ? 0 : get('hour');
  const representedAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );
  return representedAsUtc - value.getTime();
}

export function businessDateStartUtc(value: string): Date {
  const date = parseDateOnly(value);
  return new Date(date.getTime() - getTimeZoneOffsetMs(date));
}

export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayBusinessDate(): string {
  return formatBusinessDate(new Date());
}

export function dateKeysBetween(from: string, to: string): string[] {
  const result: string[] = [];
  let current = from;
  while (current <= to) {
    result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

export function isOperatingDate(value: string, operatingDays = getOperatingDays()): boolean {
  const weekdays = new Set(operatingDays.length > 0 ? operatingDays : DEFAULT_OPERATING_DAYS);
  return weekdays.has(dateKeyToUtcDate(value).getUTCDay() as OperatingDay);
}

export function operatingDateKeysBetween(
  from: string,
  to: string,
  operatingDays = getOperatingDays(),
): string[] {
  return dateKeysBetween(from, to).filter((date) => isOperatingDate(date, operatingDays));
}

export function nextOperatingDateKeys(
  after: string,
  count: number,
  operatingDays = getOperatingDays(),
): string[] {
  const result: string[] = [];
  const targetCount = Math.max(0, Math.floor(count));
  let current = addDays(after, 1);
  let guard = 0;
  while (result.length < targetCount && guard < 366 * 2) {
    if (isOperatingDate(current, operatingDays)) result.push(current);
    current = addDays(current, 1);
    guard += 1;
  }
  return result;
}

export function previousOperatingDateKeys(
  before: string,
  count: number,
  operatingDays = getOperatingDays(),
): string[] {
  const result: string[] = [];
  const targetCount = Math.max(0, Math.floor(count));
  let current = addDays(before, -1);
  let guard = 0;
  while (result.length < targetCount && guard < 366 * 2) {
    if (isOperatingDate(current, operatingDays)) result.push(current);
    current = addDays(current, -1);
    guard += 1;
  }
  return result.reverse();
}
