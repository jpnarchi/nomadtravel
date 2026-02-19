import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error Boundary para capturar errores de renderizado (como RangeError: Invalid time value)
 * y mostrar una UI de fallback en lugar de la pantalla blanca.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-stone-800 mb-2">Algo salió mal</h2>
          <p className="text-sm text-stone-500 mb-4 max-w-sm">
            {this.state.error?.message || 'Ocurrió un error inesperado al cargar esta sección.'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            variant="outline"
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
