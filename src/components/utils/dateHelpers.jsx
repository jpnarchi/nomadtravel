import { format as dateFnsFormat } from 'date-fns';

/**
 * Parsea una fecha en formato YYYY-MM-DD como fecha local (sin conversión UTC).
 * Evita el desfase de un día causado por zonas horarias.
 * Usa 12:00 PM para evitar shifts de medianoche.
 *
 * @param {string} dateString - Fecha en formato "YYYY-MM-DD"
 * @returns {Date|null} - Objeto Date en zona horaria local, o null si el input es inválido
 */
export function parseLocalDate(dateString) {
  if (!dateString) return null;
  
  // Si viene con hora ISO, parsear normalmente
  if (typeof dateString === 'string' && dateString.includes('T')) {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Para fechas YYYY-MM-DD, crear a las 12:00 PM local
  const parts = String(dateString).split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const result = new Date(year, month - 1, day, 12, 0, 0);
  if (isNaN(result.getTime())) return null;
  return result;
}

/**
 * Formatea una fecha para input de tipo date (YYYY-MM-DD).
 * 
 * @param {Date|string} date - Objeto Date o string
 * @returns {string} - Fecha en formato "YYYY-MM-DD"
 */
export function formatDateForInput(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha de forma segura, devolviendo un fallback si la fecha es inválida.
 * Envuelve date-fns format() para evitar RangeError: Invalid time value.
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

/**
 * Convierte una fecha a formato YYYY-MM-DD sin conversión de zona horaria.
 * Ideal para guardar fechas "solo día" en la base de datos.
 *
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} - Fecha en formato "YYYY-MM-DD"
 */
export function toDateOnlyString(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  
  return formatDateForInput(d);
}