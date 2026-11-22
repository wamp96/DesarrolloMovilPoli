import type { Priority } from './models';

/** Genera un identificador único para los registros locales. */
export function uid(): string {
  return crypto.randomUUID();
}

/** Fecha local en formato YYYY-MM-DD (sin desfases por zona horaria). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convierte YYYY-MM-DD a Date en hora local (00:00). */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toISODate(new Date());
}

/** Diferencia en días calendario entre hoy y la fecha dada (negativo = vencida). */
export function daysUntil(value: string): number {
  const ms = parseISODate(value).getTime() - parseISODate(today()).getTime();
  return Math.round(ms / 86_400_000);
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
export const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** "14 nov" */
export function shortDate(value: string): string {
  const d = parseISODate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Noviembre 2026" */
export function monthLabel(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** Texto relativo de vencimiento: "Hoy", "Mañana", "en 6 días", "Vencida hace 2 días". */
export function relativeDue(value: string): string {
  const days = daysUntil(value);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days > 1) return `en ${days} días`;
  if (days === -1) return 'Vencida ayer';
  return `Vencida hace ${-days} días`;
}

export const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

export function priorityLabel(p: Priority): string {
  return p === 'alta' ? 'Alta' : p === 'media' ? 'Media' : 'Baja';
}

export function priorityColor(p: Priority): string {
  return p === 'alta' ? 'danger' : p === 'media' ? 'warning' : 'success';
}

/** Hash SHA-256 en hexadecimal usando la Web Crypto API. */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Iniciales para el avatar cuando no hay foto. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/** Saludo según la hora del día. */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
