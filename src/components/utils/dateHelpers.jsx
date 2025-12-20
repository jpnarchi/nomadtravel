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
    return new Date(dateString);
  }
  
  // Para fechas YYYY-MM-DD, crear a las 12:00 PM local
  const [year, month, day] = String(dateString).split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
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