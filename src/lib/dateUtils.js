/**
 * Utilidades para manejar fechas sin problemas de zona horaria
 */

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
  return new Date(dateString);
}
