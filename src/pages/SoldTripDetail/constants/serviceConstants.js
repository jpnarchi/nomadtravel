import {
  Hotel, Plane, Car, Compass, Package, Train, Building2
} from 'lucide-react';

export const SERVICE_ICONS = {
  hotel: Hotel,
  vuelo: Plane,
  traslado: Car,
  tour: Compass,
  crucero: Package,
  tren: Train,
  dmc: Building2,
  otro: Package
};

export const SERVICE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  crucero: 'Crucero',
  tren: 'Tren',
  dmc: 'DMC',
  otro: 'Otro'
};

export const SERVICE_COLORS = {
  hotel: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  vuelo: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  traslado: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  tour: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  crucero: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  tren: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  dmc: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  otro: { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200' }
};

export const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  parcial: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-700' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  completado: { label: 'Completado', color: 'bg-emerald-100 text-emerald-800' }
};
