import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { isAdminEmail } from '@/config/adminEmails';
import { AlertCircle } from 'lucide-react';

/**
 * Componente de protección de rutas de administrador
 * Solo permite el acceso si el usuario está autenticado y su correo está en la lista de administradores
 */
export default function AdminRoute({ children }) {
  const { user, isLoaded } = useUser();

  // Mostrar loading mientras se carga la información del usuario
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;

  // Verificar si el correo del usuario está en la lista de administradores
  if (!isAdminEmail(userEmail)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100/30 to-stone-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Acceso Denegado</h2>
          <p className="text-stone-600 mb-6">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-stone-500 mb-6">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors duration-200 font-medium"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Si el usuario es administrador, renderizar el contenido
  return <>{children}</>;
}
