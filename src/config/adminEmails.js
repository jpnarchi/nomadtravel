/**
 * Lista de correos electrónicos autorizados como administradores
 * Solo los usuarios con estos correos podrán acceder a las funcionalidades de administrador
 */
export const ADMIN_EMAILS = [
  'maria.salinas@nomadtravel.mx',
  'andrea.lozano@nomadtravel.mx',
  'frida.noetzel@nomadtravel.mx',
  'sagaescobedo@gmail.com',
  'priscila.trevino@nomadtravel.mx',
  'narchijuanpablo@gmail.com'
];

/**
 * Verifica si un correo está autorizado como administrador
 * @param {string} email - El correo electrónico a verificar
 * @returns {boolean} - True si el correo está en la lista de administradores
 */
export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
