/**
 * Utilidades para manejar fechas sin problemas de zona horaria
 */
import { format as dateFnsFormat } from 'date-fns';

/**
 * Parsea una fecha YYYY-MM-DD como fecha local sin conversión de timezone.
 * Evita el bug del día corrido.
 *
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date|null} - Objeto Date o null si la fecha es inválida
 */
export function parseLocalDate(dateString) {
  if (!dateString) return null;

  // Si ya es un objeto Date, devolverlo
  if (dateString instanceof Date) return dateString;

  // Extraer solo la parte YYYY-MM-DD si viene con timestamp
  const dateOnly = String(dateString).slice(0, 10);

  const [year, month, day] = dateOnly.split('-').map(Number);

  // Validar que sean números válidos
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

/**
 * Parsea una fecha ISO completa (con hora) a objeto Date
 * Usar para timestamps completos como created_date, updated_date
 *
 * @param {string} dateString - Fecha en formato ISO
 * @returns {Date|null} - Objeto Date o null si la fecha es inválida
 */
export function parseISODate(dateString) {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha de forma segura, devolviendo un fallback si la fecha es inválida.
 * Evita RangeError: Invalid time value cuando parseLocalDate devuelve null.
 *
 * @param {Date|string|null|undefined} dateInput - Fecha o string de fecha
 * @param {string} formatStr - Patrón de formato date-fns (ej. 'd MMM yyyy')
 * @param {object} options - Opciones pasadas a format() (ej. { locale: es })
 * @param {string} fallback - Valor a mostrar si la fecha es inválida (default: '-')
 * @returns {string}
 */
export function formatDate(dateInput, formatStr, options = {}, fallback = '-') {
  try {
    const d = dateInput instanceof Date ? dateInput : parseLocalDate(dateInput);
    if (!d || isNaN(d.getTime())) return fallback;
    return dateFnsFormat(d, formatStr, options);
  } catch {
    return fallback;
  }
}
