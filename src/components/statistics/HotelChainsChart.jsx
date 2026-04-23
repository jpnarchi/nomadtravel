import React, { useMemo, useState } from 'react';
import { Hotel, DollarSign, Building2, Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PALETTE = ['#2E442A', '#3d5a37', '#4a7c59', '#5d9b6f', '#78b086', '#94c69e', '#b1dbb7', '#6b7280', '#9ca3af', '#d6d3d1'];

const HOTEL_CHAIN_LABEL = {
  hilton: 'Hilton',
  marriott: 'Marriott Bonvoy',
  hyatt: 'Hyatt',
  ihg: 'IHG',
  accor: 'Accor',
  kerzner: 'Kerzner International',
  four_seasons: 'Four Seasons',
  rosewood: 'Rosewood Hotel Group',
  aman: 'Aman',
  belmond: 'Belmond',
  auberge: 'Auberge Resorts',
  slh: 'SLH',
  design_hotels: 'Design Hotels',
  lhw: 'LHW',
  preferred_hotels: 'Preferred Hotels',
  rocco_forte: 'Rocco Forte',
  dorchester: 'Dorchester Collection',
  mandarin_oriental: 'Mandarin Oriental',
};

const HOTEL_BRAND_LABEL = {
  waldorf_astoria: 'Waldorf Astoria', conrad: 'Conrad', lxr: 'LXR',
  curio: 'Curio Collection', tapestry: 'Tapestry Collection',
  hilton_hotels: 'Hilton Hotels & Resorts', doubletree: 'DoubleTree',
  ritz_carlton: 'Ritz-Carlton', st_regis: 'St. Regis', jw_marriott: 'JW Marriott',
  w_hotels: 'W Hotels', edition: 'Edition', luxury_collection: 'Luxury Collection',
  autograph: 'Autograph Collection', westin: 'Westin', sheraton: 'Sheraton', delta: 'Delta',
  park_hyatt: 'Park Hyatt', grand_hyatt: 'Grand Hyatt', hyatt_regency: 'Hyatt Regency',
  andaz: 'Andaz', thompson: 'Thompson Hotels', alila: 'Alila', unbound: 'Unbound Collection',
  intercontinental: 'InterContinental', six_senses: 'Six Senses', regent: 'Regent',
  kimpton: 'Kimpton', vignette: 'Vignette Collection', hotel_indigo: 'Hotel Indigo',
  fairmont: 'Fairmont', raffles: 'Raffles', sofitel: 'Sofitel', mgallery: 'MGallery',
  mondrian: 'Mondrian', ennismore: 'Ennismore Collection', banyan_tree: 'Banyan Tree',
  one_and_only: 'One&Only', siro: 'SIRO', atlantis: 'Atlantis',
  four_seasons: 'Four Seasons', rosewood_hotels: 'Rosewood Hotels', khos: 'KHOS',
  new_world: 'New World Hotels', aman_resorts: 'Aman Resorts',
  belmond_hotels: 'Belmond Hotels & Trains', auberge: 'Auberge', slh: 'SLH',
  design_hotels: 'Design Hotels', lhw: 'LHW',
};

function getHotelField(s, field) {
  return s.metadata?.[field] || s[field];
}

function resolveChain(raw) {
  if (!raw?.trim()) return null;
  const key = raw.trim();
  if (key === 'otro') return null;
  return HOTEL_CHAIN_LABEL[key] || key;
}

function resolveBrand(raw) {
  if (!raw?.trim()) return null;
  const key = raw.trim();
  if (key === 'otro') return null;
  return HOTEL_BRAND_LABEL[key] || key;
}

const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-stone-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#2E442A' }}>
          {valuePrefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{valueSuffix}
        </p>
      ))}
    </div>
  );
};

export default function HotelChainsChart({ services }) {
  const [showAllHotels, setShowAllHotels] = useState(false);

  const hotelServices = services.filter(
    s => s.service_type?.trim().toLowerCase() === 'hotel'
  );

  // --- cadenas (excluye "otro" y sin valor) ---
  const chainData = useMemo(() => {
    const map = new Map();
    hotelServices.forEach(s => {
      const label = resolveChain(getHotelField(s, 'hotel_chain'));
      if (!label) return;
      if (!map.has(label)) map.set(label, { name: label, reservas: 0, ventas: 0, comision: 0 });
      const b = map.get(label);
      b.reservas += 1;
      b.ventas += s.price || 0;
      b.comision += s.commission || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.reservas - a.reservas);
  }, [hotelServices]);

  // --- sub-marcas (excluye "otro" y sin valor; si no hay brand usa chain) ---
  const brandData = useMemo(() => {
    const map = new Map();
    hotelServices.forEach(s => {
      const brandRaw = getHotelField(s, 'hotel_brand');
      const chainRaw = getHotelField(s, 'hotel_chain');
      const label = resolveBrand(brandRaw) || resolveChain(chainRaw);
      if (!label) return;
      if (!map.has(label)) map.set(label, { name: label, reservas: 0 });
      map.get(label).reservas += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.reservas - a.reservas).slice(0, 12);
  }, [hotelServices]);

  // --- lista de hoteles individuales ---
  const hotelList = useMemo(() => {
    const map = new Map();
    hotelServices.forEach(s => {
      const nameRaw = getHotelField(s, 'hotel_name')?.trim();
      const name = nameRaw || s.service_name?.trim() || null;
      if (!name) return;
      const chain = resolveChain(getHotelField(s, 'hotel_chain')) || '—';
      const brand = resolveBrand(getHotelField(s, 'hotel_brand')) || null;
      const key = name.toLowerCase();
      if (!map.has(key)) map.set(key, { name, chain, brand, reservas: 0, ventas: 0 });
      const b = map.get(key);
      b.reservas += 1;
      b.ventas += s.price || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.ventas - a.ventas);
  }, [hotelServices]);

  const totalVentas = hotelServices.reduce((s, h) => s + (h.price || 0), 0);
  const totalComision = hotelServices.reduce((s, h) => s + (h.commission || 0), 0);
  const visibleHotels = showAllHotels ? hotelList : hotelList.slice(0, 8);

  if (hotelServices.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-100 text-center">
        <Hotel className="w-14 h-14 mx-auto mb-4 text-stone-200" />
        <p className="text-stone-500 font-medium">No hay servicios de hotel registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Hotel, bg: 'bg-[#2E442A]/10', color: '#2E442A', value: hotelServices.length, label: 'Reservas de hotel' },
          { icon: Building2, bg: 'bg-blue-50', color: '#3b82f6', value: chainData.length, label: 'Cadenas' },
          { icon: DollarSign, bg: 'bg-emerald-50', color: '#10b981', value: `$${totalVentas.toLocaleString()}`, label: 'Total vendido' },
          { icon: Star, bg: 'bg-purple-50', color: '#8b5cf6', value: `$${totalComision.toLocaleString()}`, label: 'Comisiones' },
        ].map(({ icon: Icon, bg, color, value, label }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800 leading-tight">{value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reservas y Ventas por Cadena — side by side */}
      {chainData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reservas por cadena */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Reservas por cadena</h3>
            <div style={{ height: Math.max(180, chainData.length * 38) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chainData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeec" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#57534e' }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip valueSuffix=" reservas" />} />
                  <Bar dataKey="reservas" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {chainData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ventas por cadena */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Ventas por cadena (USD)</h3>
            <div style={{ height: Math.max(180, chainData.length * 38) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chainData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeec" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#57534e' }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                  <Bar dataKey="ventas" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {chainData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sub-marcas */}
      {brandData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <h3 className="font-semibold text-stone-800 mb-4">Sub-marcas y colecciones</h3>
          <div style={{ height: Math.max(160, brandData.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eeec" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#57534e' }} width={160} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip valueSuffix=" reservas" />} />
                <Bar dataKey="reservas" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {brandData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla de hoteles */}
      {hotelList.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-stone-400" />
              <h3 className="font-semibold text-stone-800">Hoteles</h3>
              <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{hotelList.length}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span>Ordenado por ventas</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-5 py-3 font-medium text-stone-500 text-xs">#</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs">Hotel</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs">Cadena</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs">Marca</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs">Reservas</th>
                  <th className="text-right px-5 py-3 font-medium text-stone-500 text-xs">Total (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {visibleHotels.map((h, i) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3 text-stone-400 text-xs font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{h.name}</td>
                    <td className="px-4 py-3">
                      {h.chain !== '—' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#2E442A]/8 text-[#2E442A] text-xs font-medium">
                          {h.chain}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{h.brand || '—'}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{h.reservas}</td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-800">
                      ${h.ventas.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hotelList.length > 8 && (
            <button
              onClick={() => setShowAllHotels(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
            >
              {showAllHotels ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Ver menos</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Ver {hotelList.length - 8} hoteles más</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
