import React, { useState, useEffect, createContext, useContext } from 'react';
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
                              Database
                            } from 'lucide-react';
import QuickPaymentFAB from '@/components/ui/QuickPaymentFAB';
import PaymentInfoModal from '@/components/ui/PaymentInfoModal';
import CommissionInfoModal from '@/components/ui/CommissionInfoModal';
import CheatSheetBar from '@/components/ui/CheatSheetBar';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useUser, useClerk } from '@clerk/clerk-react';
import { isAdminEmail } from '@/config/adminEmails';

export const ViewModeContext = createContext({ viewMode: 'admin', isActualAdmin: false });

export default function Layout({ children, currentPageName }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();

  // Convert Clerk user to app user format
  const appUser = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    full_name: user.fullName || user.username,
    role: user.publicMetadata?.role || 'user',
    custom_role: user.publicMetadata?.custom_role
  } : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
  const [commissionInfoOpen, setCommissionInfoOpen] = useState(false);
  const [viewMode, setViewMode] = useState('admin');

  useEffect(() => {
    const fetchExchangeRate = async () => {
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
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      } finally {
        setRateLoading(false);
      }
    };
    fetchExchangeRate();
  }, []);

  // Verificar si el correo del usuario está en la lista de administradores permitidos
  const isActualAdmin = isAdminEmail(appUser?.email);
  const isSupervisor = appUser?.custom_role === 'supervisor';
  const isAdmin = isActualAdmin && viewMode === 'admin';

  const adminNavigation = [
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
      { name: 'Descargar Datos', page: 'DescargarDatos', icon: Database },
      { name: '--- Control Interno ---', divider: true },
      { name: 'Asistencia', page: 'Attendance', icon: Users },
      { name: 'FAM Trips', page: 'FamTrips', icon: Plane },
      { name: 'Ferias', page: 'IndustryFairs', icon: LayoutDashboard },
    ];

    const userNavigation = [
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
    ];

    const navigation = isAdmin ? adminNavigation : userNavigation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100/30 to-stone-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');

          @font-face {
            font-family: 'The Seasons';
            src: url('/src/fonts/The-Seasons-Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
          }

          * {
            font-family: 'Montserrat', sans-serif;
          }

          h1, h2, h3, h4, h5, h6, .heading-font {
            font-family: 'The Seasons', serif;
            letter-spacing: 0.01em;
          }

          p, span, .text-body, label {
            font-family: 'Cormorant Garamond', serif;
            letter-spacing: 0.015em;
          }

          button {
            font-family: 'Montserrat', sans-serif;
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
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 rounded-xl hover:bg-white/60 transition-all duration-200 active:scale-95"
            style={{ color: 'var(--nomad-green-dark)' }}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full sidebar-shadow transform transition-all duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "lg:w-16" : "lg:w-80",
        "w-80"
      )}
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #fafaf9 100%)',
        borderRight: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="flex flex-col h-full">
          {/* Toggle Button (Desktop Only) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "hidden lg:flex items-center justify-center transition-all duration-300 group",
              sidebarCollapsed
                ? "mx-auto mt-4 mb-3 w-10 h-10 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-sm"
                : "absolute right-6 top-6 z-50 w-10 h-10 rounded-xl luxury-glow hover:shadow-2xl hover:scale-105 active:scale-95 luxury-border"
            )}
            style={!sidebarCollapsed ? {
              background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)'
            } : {}}
          >
            {!sidebarCollapsed && (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/30"></div>
                <div className="absolute inset-0 luxury-shimmer opacity-40 group-hover:opacity-100 transition-opacity"></div>
              </>
            )}
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-stone-700 transition-colors" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white relative z-10 drop-shadow-sm" />
            )}
          </button>

          {/* Logo & User */}
          <div className={cn(
            "transition-all duration-300",
            sidebarCollapsed ? "lg:hidden" : "p-7 border-b border-stone-100/80"
          )}>
            {/* Collapsed State - Empty */}
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-black">
                  Nomad Travel
                </h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--luxury-gold)' }}>Luxury Travel CRM</p>
              </div>
            )}

            {/* Admin View Mode Switch */}
                          {isActualAdmin && !sidebarCollapsed && (
                            <div className="mt-5 p-4 rounded-2xl shadow-sm relative overflow-hidden"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                                   border: '1px solid rgba(99, 102, 241, 0.15)'
                                 }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                       style={{
                                         background: viewMode === 'admin'
                                           ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.25) 100%)'
                                           : 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.25) 100%)'
                                       }}>
                                    {viewMode === 'admin' ? (
                                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-purple-600" />
                                    )}
                                  </div>
                                  <span className="text-sm font-semibold text-stone-700">
                                    {viewMode === 'admin' ? 'Vista Admin' : 'Vista Usuario'}
                                  </span>
                                </div>
                                <Switch
                                  checked={viewMode === 'admin'}
                                  onCheckedChange={(checked) => setViewMode(checked ? 'admin' : 'user')}
                                />
                              </div>
                              <p className="text-sm text-stone-600 font-medium">
                                {viewMode === 'admin'
                                  ? 'Viendo todos los datos'
                                  : 'Viendo solo tus datos'}
                              </p>
                            </div>
                          )}

                          {/* Exchange Rate */}
                          {!sidebarCollapsed && (
                            <div className="mt-5 elegant-card rounded-2xl p-4 shadow-sm luxury-border">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm relative overflow-hidden"
                                     style={{ background: 'linear-gradient(135deg, var(--nomad-green-light) 0%, var(--nomad-green) 100%)' }}>
                                  <DollarSign className="w-4 h-4 text-white relative z-10" />
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20"></div>
                                </div>
                                <span className="text-sm font-semibold text-stone-700">USD/MXN BBVA Venta</span>
                              </div>
                              {rateLoading ? (
                                <div className="flex items-center gap-2 py-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                                  <span className="text-sm text-stone-500 font-medium">Cargando...</span>
                                </div>
                              ) : exchangeRate?.sell_rate ? (
                                <p className="text-3xl font-bold mb-3 text-stone-900">
                                  ${exchangeRate.sell_rate.toFixed(2)} <span className="text-base font-medium text-stone-500">MXN</span>
                                </p>
                              ) : (
                                <p className="text-sm text-stone-400 py-2">No disponible</p>
                              )}
                              <button
                                onClick={() => setPaymentInfoOpen(true)}
                                className="mt-2 w-full text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-white shadow-sm hover:shadow-md active:scale-98 relative overflow-hidden luxury-border"
                                style={{
                                  background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10"></div>
                                <span className="relative z-10">Info de Pagos</span>
                              </button>
                              <button
                                onClick={() => setCommissionInfoOpen(true)}
                                className="mt-2 w-full text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-white shadow-sm hover:shadow-md active:scale-98 relative overflow-hidden luxury-border"
                                style={{
                                  background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10"></div>
                                <span className="relative z-10">Info Pago de Comisiones</span>
                              </button>
                            </div>
                          )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 overflow-y-auto scrollbar-thin",
            sidebarCollapsed ? "lg:px-2 lg:py-2 lg:space-y-2" : "p-5 space-y-1.5"
          )}>
            {navigation.map((item, idx) => {
                if (item.divider) {
                  if (sidebarCollapsed) {
                    return (
                      <div key={idx} className="hidden lg:block my-2 mx-1 border-t border-stone-200/60" />
                    );
                  }
                  return (
                    <div key={idx} className="px-3 py-3 mt-2">
                      <p className="text-sm font-bold text-stone-400 tracking-wide">{item.name}</p>
                    </div>
                  );
                }
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 transition-all duration-200 group relative overflow-hidden",
                      sidebarCollapsed ? "lg:justify-center lg:w-12 lg:h-12 lg:mx-auto lg:rounded-lg" : "rounded-xl px-4 py-3.5",
                      isActive
                        ? sidebarCollapsed
                          ? "lg:bg-stone-100 lg:border-2 lg:border-stone-900 text-stone-900"
                          : "bg-stone-100 border-l-4 border-stone-900 text-stone-900"
                        : sidebarCollapsed
                          ? "lg:bg-white lg:border lg:border-stone-200 lg:hover:bg-stone-50 lg:hover:border-stone-300 lg:shadow-sm text-stone-600"
                          : "text-stone-600 hover:bg-gradient-to-r hover:from-stone-100/60 hover:to-stone-200/40"
                    )}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <item.icon className={cn(
                      "transition-all duration-200 relative z-10",
                      sidebarCollapsed ? "lg:w-5 lg:h-5" : "w-5 h-5 group-hover:scale-110",
                      isActive
                        ? "text-stone-900"
                        : sidebarCollapsed
                          ? "lg:text-stone-600 lg:group-hover:text-stone-800"
                          : "text-stone-500 group-hover:text-stone-700"
                    )} />
                    {!sidebarCollapsed && (
                      <span className="font-semibold text-base relative z-10">{item.name}</span>
                    )}
                    {sidebarCollapsed && (
                      <span className="lg:hidden font-semibold text-base relative z-10">{item.name}</span>
                    )}
                  </Link>
                );
              })}
          </nav>

          {/* Footer - User Info */}
          <div className={cn(
            "border-t border-stone-100/80",
            sidebarCollapsed ? "lg:p-2" : "p-5"
          )}>
            {sidebarCollapsed ? (
              <div className="hidden lg:flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-sm flex items-center justify-center transition-all duration-200 group">
                  <Users className="w-5 h-5 text-stone-600 group-hover:text-stone-800 transition-colors" />
                </div>
              </div>
            ) : (
              <div className="elegant-card rounded-2xl p-4 shadow-sm luxury-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-md"
                         style={{ background: 'linear-gradient(135deg, var(--nomad-green) 0%, var(--nomad-green-medium) 100%)' }}>
                      <Users className="w-5 h-5 text-white relative z-10" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/30"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-stone-800 truncate">{appUser?.full_name || 'Usuario'}</p>
                      <p className="text-sm text-stone-600 truncate">{appUser?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="flex-shrink-0 h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-lg transition-all duration-200"
                  >
                    Salir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 lg:pt-0 min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-80"
      )}>
        <div className="p-4 lg:p-8">
          <ViewModeContext.Provider value={{ viewMode: isActualAdmin ? viewMode : 'user', isActualAdmin }}>
            {children}
          </ViewModeContext.Provider>
        </div>
      </main>

      {/* Quick Payment FAB */}
              {/* <QuickPaymentFAB /> */}

              {/* Cheat Sheet Bar */}
              {/* <CheatSheetBar /> */}

              {/* Payment Info Modal */}
                      <PaymentInfoModal open={paymentInfoOpen} onClose={() => setPaymentInfoOpen(false)} />

                      {/* Commission Info Modal */}
                      <CommissionInfoModal open={commissionInfoOpen} onClose={() => setCommissionInfoOpen(false)} />
                    </div>
          );
        }