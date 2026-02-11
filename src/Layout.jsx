import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
                          LayoutDashboard,
                          Users,
                          Plane,
                          CheckCircle,
                          Menu,
                          X,
                          MapPin,
                          DollarSign,
                          Loader2,
                          Building2,
                          BarChart3,
                          BookOpen,
                          Key,
                          Wallet,
                          Lock,
                          Eye,
                          ShieldCheck,
                          Upload,
                          CreditCard,
                          ChevronLeft,
                          ChevronRight,
                          Database,
                          Search
                        } from 'lucide-react';
import QuickPaymentFAB from '@/components/ui/QuickPaymentFAB';
import PaymentInfoModal from '@/components/ui/PaymentInfoModal';
import CommissionInfoModal from '@/components/ui/CommissionInfoModal';
import CheatSheetBar from '@/components/ui/CheatSheetBar';
import ErrorReportButton from '@/components/ui/ErrorReportButton';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import { isAdminEmail } from '@/config/adminEmails';

export const ViewModeContext = createContext({ viewMode: 'admin', isActualAdmin: false });

// Cache para tipo de cambio (15 minutos)
const EXCHANGE_RATE_CACHE_KEY = 'exchange_rate_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

// Componente memoizado para item de navegación con tooltip
const SidebarNavItem = memo(({ item, isActive, collapsed, onClick }) => {
  const ItemContent = (
    <Link
      to={createPageUrl(item.page)}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 transition-all duration-200 group relative overflow-hidden rounded-xl px-4 py-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
        collapsed ? "lg:justify-center lg:px-3" : "",
        isActive
          ? "bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-lg shadow-stone-900/20"
          : "text-stone-600 hover:bg-gradient-to-r hover:from-stone-100/60 hover:to-stone-200/40 hover:shadow-sm"
      )}
    >
      {/* Efecto de pulso para item activo */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      <item.icon className={cn(
        "w-5 h-5 transition-all duration-200 relative z-10 flex-shrink-0",
        isActive
          ? "text-white drop-shadow-sm scale-110"
          : "text-stone-500 group-hover:text-stone-700 group-hover:scale-110"
      )} />

      {!collapsed && (
        <span className="font-semibold text-base relative z-10 truncate">{item.name}</span>
      )}

      {/* Indicador activo */}
      {isActive && !collapsed && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full shadow-lg" />
      )}
    </Link>
  );

  // En modo collapsed, mostrar tooltip
  if (collapsed) {
    return (
      <div className="hidden lg:block group relative">
        {ItemContent}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-stone-900 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            {item.name}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-900" />
          </div>
        </div>
      </div>
    );
  }

  return ItemContent;
});

SidebarNavItem.displayName = 'SidebarNavItem';

// Componente para divider
const NavDivider = memo(({ text, collapsed }) => {
  if (collapsed) return null;

  return (
    <div className="px-3 py-3 mt-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
        <p className="text-xs font-bold text-stone-400 tracking-wide uppercase">{text}</p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      </div>
    </div>
  );
});

NavDivider.displayName = 'NavDivider';

// Componente para el widget de tipo de cambio
const ExchangeRateWidget = memo(({ collapsed, onPaymentInfoClick, onCommissionInfoClick }) => {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      // Verificar cache
      try {
        const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setExchangeRate(data);
            setRateLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading cache:', e);
      }

      // Fetch nuevo
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: "¿Cuál es el tipo de cambio de VENTA de dólares USD a pesos mexicanos MXN de BBVA México hoy? Solo responde con el número del tipo de cambio de venta (el precio al que BBVA vende dólares al público), nada más.",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              sell_rate: { type: "number", description: "Tipo de cambio de venta USD a MXN" },
              date: { type: "string", description: "Fecha de la consulta" }
            }
          }
        });

        setExchangeRate(result);

        // Guardar en cache
        try {
          localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
            data: result,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error saving cache:', e);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      } finally {
        setRateLoading(false);
      }
    };

    fetchExchangeRate();
  }, []);

  if (collapsed) return null;

  return (
    <div className="mt-4 space-y-2">
      {/* Exchange Rate Card - Compacto */}
      <div className="elegant-card rounded-xl p-3 shadow-sm luxury-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center relative overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, var(--nomad-green-light) 0%, var(--nomad-green) 100%)' }}>
              <DollarSign className="w-3.5 h-3.5 text-white relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-stone-500">USD/MXN</span>
              {rateLoading ? (
                <div className="h-4 w-16 bg-stone-200/50 rounded animate-pulse" />
              ) : exchangeRate?.sell_rate ? (
                <span className="text-base font-bold text-stone-900">${exchangeRate.sell_rate.toFixed(2)}</span>
              ) : (
                <span className="text-xs text-stone-400">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botones Compactos con Dropdown Style */}
      <div className="space-y-1.5 ">
        <button
          onClick={onPaymentInfoClick}
          className="w-full text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 text-stone-700 bg-stone-100/60 hover:bg-stone-100 active:scale-98 flex items-center justify-between group"
        >
          <span>Info de Pagos</span>
          <Wallet className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" />
        </button>

        <button
          onClick={onCommissionInfoClick}
          className="w-full text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 text-stone-700 bg-stone-100/60 hover:bg-stone-100 active:scale-98 flex items-center justify-between group"
        >
          <span>Info Comisiones</span>
          <CreditCard className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors " />
        </button>
      </div>
    </div>
  );
});

ExchangeRateWidget.displayName = 'ExchangeRateWidget';

// Componente principal
export default function Layout({ children, currentPageName }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();

  // Convert Clerk user to app user format
  const appUser = useMemo(() => user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    full_name: user.fullName || user.username,
    role: user.publicMetadata?.role || 'user',
    custom_role: user.publicMetadata?.custom_role
  } : null, [user]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Leer del localStorage
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
  const [commissionInfoOpen, setCommissionInfoOpen] = useState(false);
  const [viewMode, setViewMode] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');

  // Guardar estado de collapsed en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(sidebarCollapsed));
    } catch (e) {
      console.error('Error saving sidebar state:', e);
    }
  }, [sidebarCollapsed]);

  // Verificar si el correo del usuario está en la lista de administradores permitidos
  const isActualAdmin = useMemo(() => isAdminEmail(appUser?.email), [appUser?.email]);
  const isSupervisor = useMemo(() => appUser?.custom_role === 'supervisor', [appUser?.custom_role]);
  const isAdmin = isActualAdmin && viewMode === 'admin';

  const adminNavigation = useMemo(() => [
    { name: 'Dashboard Global', page: 'AdminDashboard', icon: LayoutDashboard },
    { name: 'Todos los Clientes', page: 'AdminClients', icon: Users },
    { name: 'Todos los Viajes', page: 'AdminTrips', icon: Plane },
    { name: 'Viajes Vendidos', page: 'AdminSoldTrips', icon: CheckCircle },
    { name: 'Progreso de Agentes', page: 'Statistics', icon: BarChart3 },
    { name: 'Comisiones Internas', page: 'InternalCommissions', icon: Wallet },
    { name: 'Pagos Internos de Proveedores', page: 'InternalPayments', icon: DollarSign },
    { name: 'Pagos Internos Clientes', page: 'InternalClientPayments', icon: CreditCard },
    { name: 'Proveedores', page: 'Suppliers', icon: Building2 },
    { name: 'Learning & Reviews', page: 'Reviews', icon: BookOpen },
    { name: 'Contraseñas', page: 'Credentials', icon: Key },
    { name: '--- Control Interno ---', divider: true },
    { name: 'Asistencia', page: 'Attendance', icon: Users },
    { name: 'FAM Trips', page: 'FamTrips', icon: Plane },
    { name: 'Ferias', page: 'IndustryFairs', icon: LayoutDashboard },
  ], []);

  const userNavigation = useMemo(() => [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Clientes', page: 'Clients', icon: Users },
    { name: 'Viajes', page: 'Trips', icon: Plane },
    { name: 'Viajes Vendidos', page: 'SoldTrips', icon: CheckCircle },
    { name: 'Comisiones', page: 'Commissions', icon: DollarSign },
    { name: 'Mi Progreso', page: 'Statistics', icon: BarChart3 },
    { name: 'Proveedores', page: 'Suppliers', icon: Building2 },
    { name: 'Learning & Reviews', page: 'Reviews', icon: BookOpen },
    { name: 'Contraseñas', page: 'Credentials', icon: Key },
    { name: 'Mis Contraseñas', page: 'PersonalCredentials', icon: Lock },
    ...(isSupervisor ? [
      { name: '--- Control Interno ---', divider: true },
      { name: 'Asistencia', page: 'Attendance', icon: Users },
      { name: 'FAM Trips', page: 'FamTrips', icon: Plane },
      { name: 'Ferias', page: 'IndustryFairs', icon: LayoutDashboard },
    ] : [])
  ], [isSupervisor]);

  const navigation = useMemo(() => isAdmin ? adminNavigation : userNavigation, [isAdmin, adminNavigation, userNavigation]);

  // Filtrar navegación por búsqueda
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) return navigation;

    const query = searchQuery.toLowerCase();
    return navigation.filter(item =>
      !item.divider && item.name.toLowerCase().includes(query)
    );
  }, [navigation, searchQuery]);

  // Callbacks memoizados
  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
  const handleSidebarToggle = useCallback(() => setSidebarOpen(prev => !prev), []);
  const handleCollapsedToggle = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const handlePaymentInfoOpen = useCallback(() => setPaymentInfoOpen(true), []);
  const handlePaymentInfoClose = useCallback(() => setPaymentInfoOpen(false), []);
  const handleCommissionInfoOpen = useCallback(() => setCommissionInfoOpen(true), []);
  const handleCommissionInfoClose = useCallback(() => setCommissionInfoOpen(false), []);

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B para toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleCollapsedToggle();
      }

      // Escape para cerrar sidebar móvil
      if (e.key === 'Escape' && sidebarOpen) {
        handleSidebarClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, handleCollapsedToggle, handleSidebarClose]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          h1, h2, h3, h4, h5, h6, .heading-font {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: 700;
            letter-spacing: -0.02em;
          }

          p, span, .text-body, label {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: -0.01em;
          }

          button {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: 500;
          }

          :root {
            --nomad-green: #2D4629;
            --nomad-green-light: #3F5E39;
            --nomad-green-medium: #243A20;
            --nomad-green-dark: #1A2E17;
            --nomad-green-glow: rgba(45, 70, 41, 0.2);
            --luxury-gold: #D4AF37;
            --luxury-gold-light: #E8C968;
          }

          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }

          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }

          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, var(--nomad-green), var(--nomad-green-dark));
            border-radius: 10px;
          }

          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, var(--nomad-green-light), var(--nomad-green));
          }

          .glass-effect {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          .sidebar-shadow {
            box-shadow:
              0 0 60px rgba(45, 70, 41, 0.08),
              4px 0 24px rgba(0, 0, 0, 0.04),
              2px 0 8px rgba(0, 0, 0, 0.02);
          }

          .elegant-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 250, 249, 0.9));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(45, 70, 41, 0.1);
          }

          .luxury-gradient {
            background: linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%);
          }

          .luxury-border {
            border: 1px solid rgba(212, 175, 55, 0.2);
          }

          .luxury-glow {
            box-shadow:
              0 0 20px rgba(45, 70, 41, 0.2),
              0 4px 16px rgba(45, 70, 41, 0.15);
          }

          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }

          .luxury-shimmer {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(212, 175, 55, 0.1),
              transparent
            );
            background-size: 200% 100%;
            animation: shimmer 3s infinite;
          }

          @keyframes animate-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .animate-shimmer {
            animation: animate-shimmer 2s infinite;
          }
        `}
      </style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/50 px-5 py-4 shadow-lg shadow-stone-900/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center luxury-glow relative overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)' }}>
              <MapPin className="w-6 h-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/30"></div>
              <div className="absolute inset-0 luxury-shimmer"></div>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900">Nomad Travel Society</h1>
              <p className="text-sm text-stone-600 font-medium">Luxury Travel CRM</p>
            </div>
          </div>
          <button
            onClick={handleSidebarToggle}
            className="p-2.5 rounded-xl hover:bg-white/60 transition-all duration-200 active:scale-95"
            style={{ color: 'var(--nomad-green-dark)' }}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={handleSidebarClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full sidebar-shadow transform transition-all duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "lg:w-20" : "lg:w-80",
        "w-80"
      )}
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #fafaf9 100%)',
        borderRight: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="flex flex-col h-full">
          {/* Toggle Button (Desktop Only) */}
          <button
            onClick={handleCollapsedToggle}
            className={cn(
              "hidden lg:flex items-center justify-center transition-all duration-300 group",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
              sidebarCollapsed
                ? "mx-auto mt-4 mb-4 w-12 h-12 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-sm"
                : "absolute right-6 top-6 z-50 w-10 h-10 rounded-xl luxury-glow hover:shadow-2xl hover:scale-105 active:scale-95 luxury-border"
            )}
            style={!sidebarCollapsed ? {
              background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)'
            } : {}}
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            title={`${sidebarCollapsed ? 'Expandir' : 'Colapsar'} (Ctrl+B)`}
          >
            {!sidebarCollapsed && (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/30"></div>
                <div className="absolute inset-0 luxury-shimmer opacity-40 group-hover:opacity-100 transition-opacity"></div>
              </>
            )}
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-stone-700 transition-colors" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white relative z-10 drop-shadow-sm" />
            )}
          </button>

          {/* Logo & User - Sticky */}
          <div className={cn(
            "transition-all duration-300 sticky top-0 z-10 bg-white/95 backdrop-blur-sm",
            sidebarCollapsed ? "lg:py-4 lg:px-4 lg:border-b lg:border-stone-100/80" : "p-7 border-b border-stone-100/80"
          )}>
            {sidebarCollapsed ? (
              <div className="hidden lg:flex justify-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)' }}>
                  <span className="text-2xl font-bold text-white relative z-10">N</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/30"></div>
                  <div className="absolute inset-0 luxury-shimmer"></div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-black">
                  Nomad Travel
                </h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--luxury-gold)' }}>Luxury Travel CRM</p>
              </div>
            )}

            {/* Admin View Mode Switch - Compacto */}
            {isActualAdmin && !sidebarCollapsed && (
              <div className="mt-4 p-3 rounded-xl shadow-sm relative overflow-hidden "
                   style={{
                     background: viewMode === 'admin'
                       ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)'
                       : 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
                     border: viewMode === 'admin'
                       ? '1px solid rgba(99, 102, 241, 0.15)'
                       : '1px solid rgba(168, 85, 247, 0.15)'
                   }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                         style={{
                           background: viewMode === 'admin'
                             ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%)'
                             : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.3) 100%)'
                         }}>
                      {viewMode === 'admin' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-stone-700">
                        {viewMode === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                      <span className="text-xs text-stone-500">
                        {viewMode === 'admin' ? 'Todos los datos' : 'Solo tus datos'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={viewMode === 'admin'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'admin' : 'user')}
                  />
                </div>
              </div>
            )}

            {/* Exchange Rate Widget */}
            <ExchangeRateWidget
              collapsed={sidebarCollapsed}
              onPaymentInfoClick={handlePaymentInfoOpen}
              onCommissionInfoClick={handleCommissionInfoOpen}
            />
          </div>

          {/* Search Bar */}
          {!sidebarCollapsed && (
            <div className="px-5 pt-2 pb-2 ">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 " />
                <input
                  type="text"
                  placeholder="Buscar página..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-100/60 border border-stone-200/60 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all duration-200 text-sm"
                />
              </div>
            </div>
          )}

          {/* Spacer when collapsed */}
          {sidebarCollapsed && (
            <div className="hidden lg:block flex-1"></div>
          )}

          {/* Navigation */}
          <nav className={cn(
            "flex-1 overflow-y-auto scrollbar-thin",
            sidebarCollapsed ? "lg:flex lg:flex-col lg:items-stretch lg:px-3 lg:space-y-2" : "p-5 space-y-1.5"
          )}>
            {(searchQuery ? filteredNavigation : navigation).map((item, idx) => {
              if (item.divider) {
                return <NavDivider key={idx} text={item.name} collapsed={sidebarCollapsed} />;
              }

              const isActive = currentPageName === item.page;
              return (
                <SidebarNavItem
                  key={item.page}
                  item={item}
                  isActive={isActive}
                  collapsed={sidebarCollapsed}
                  onClick={handleSidebarClose}
                />
              );
            })}

            {searchQuery && filteredNavigation.length === 0 && (
              <div className="text-center py-8 text-stone-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No se encontraron páginas</p>
              </div>
            )}
          </nav>

          {/* Footer - User Info - Sticky */}
          <div className={cn(
            "border-t border-stone-100/80 sticky bottom-0 bg-white/95 backdrop-blur-sm",
            sidebarCollapsed ? "lg:p-4" : "p-5"
          )}>
            {sidebarCollapsed ? (
              <div className="hidden lg:flex justify-center group relative">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-12 h-12",
                      userButtonPopoverCard: "shadow-lg",
                      userButtonPopoverActionButton__signOut: "text-red-600 hover:text-red-700 hover:bg-red-50/80"
                    }
                  }}
                />
                {/* Tooltip para usuario */}
                <div className="absolute left-full ml-2 bottom-0 z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-stone-900 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    {appUser?.full_name || 'Usuario'}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-900" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="elegant-card rounded-2xl p-4 shadow-sm luxury-border">
                <div className="flex items-center gap-3">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-10 h-10",
                        userButtonPopoverCard: "shadow-lg",
                        userButtonPopoverActionButton__signOut: "text-red-600 hover:text-red-700 hover:bg-red-50/80"
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-stone-800 truncate">{appUser?.full_name || 'Usuario'}</p>
                    <p className="text-sm text-stone-600 truncate">{appUser?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 lg:pt-0 min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-80"
      )}>
        <div className="p-4 lg:p-8">
          <ViewModeContext.Provider value={{ viewMode: isActualAdmin ? viewMode : 'user', isActualAdmin }}>
            {children}
          </ViewModeContext.Provider>
        </div>
      </main>

      {/* Quick Payment FAB */}
      <QuickPaymentFAB />

      {/* Error Report Button */}
      <ErrorReportButton />

      {/* Payment Info Modal */}
      <PaymentInfoModal open={paymentInfoOpen} onClose={handlePaymentInfoClose} />

      {/* Commission Info Modal */}
      <CommissionInfoModal open={commissionInfoOpen} onClose={handleCommissionInfoClose} />
    </div>
  );
}
