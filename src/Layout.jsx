import React, { useState, useEffect } from 'react';
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
        Wallet
      } from 'lucide-react';
import QuickPaymentFAB from '@/components/ui/QuickPaymentFAB';
import PaymentInfoModal from '@/components/ui/PaymentInfoModal';
import CommissionInfoModal from '@/components/ui/CommissionInfoModal';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
  const [commissionInfoOpen, setCommissionInfoOpen] = useState(false);

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

  const navigation = [
            { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
            { name: 'Clientes', page: 'Clients', icon: Users },
            { name: 'Viajes', page: 'Trips', icon: Plane },
            { name: 'Viajes Vendidos', page: 'SoldTrips', icon: CheckCircle },
            { name: 'Comisiones', page: 'Commissions', icon: DollarSign },
            { name: 'Comisiones Internas', page: 'InternalCommissions', icon: Wallet },
            { name: 'Pagos Internos', page: 'InternalPayments', icon: DollarSign },
            { name: 'Mi Progreso', page: 'Statistics', icon: BarChart3 },
            { name: 'Proveedores', page: 'Suppliers', icon: Building2 },
            { name: 'Learning & Reviews', page: 'Reviews', icon: BookOpen },
            { name: 'Contraseñas', page: 'Credentials', icon: Key },
          ];

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
          
          * {
            font-family: 'Montserrat', sans-serif;
          }
          
          :root {
            --nomad-green: #2E442A;
            --nomad-green-light: #3d5a37;
            --nomad-green-dark: #1f2e1c;
          }
          
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: #f5f5f4;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #2E442A;
            border-radius: 3px;
          }
        `}
      </style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A' }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: '#2E442A' }}>Nomad Travel Society</h1>
              <p className="text-xs text-stone-500">CRM</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
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
        "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-stone-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#2E442A' }}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: '#2E442A' }}>
                  Nomad Travel
                </h1>
                <p className="text-xs text-stone-500 font-medium">Society CRM</p>
              </div>
            </div>

            {/* Exchange Rate */}
                          <div className="mt-4 p-3 bg-stone-50 rounded-xl">
                            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                                            <DollarSign className="w-3 h-3" />
                                            <span>USD/MXN BBVA Venta</span>
                                          </div>
                                          {rateLoading ? (
                                            <div className="flex items-center gap-2">
                                              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                                              <span className="text-xs text-stone-400">Cargando...</span>
                                            </div>
                                          ) : exchangeRate?.sell_rate ? (
                                            <p className="text-lg font-bold" style={{ color: '#2E442A' }}>
                                              ${exchangeRate.sell_rate.toFixed(2)} MXN
                                            </p>
                                          ) : (
                                            <p className="text-xs text-stone-400">No disponible</p>
                                          )}
                            <button
                              onClick={() => setPaymentInfoOpen(true)}
                              className="mt-2 w-full text-xs font-medium py-1.5 px-3 rounded-lg transition-colors text-white"
                              style={{ backgroundColor: '#2E442A' }}
                            >
                              Info de Pagos
                            </button>
                          </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "text-white shadow-lg" 
                      : "text-stone-600 hover:bg-stone-100"
                  )}
                  style={isActive ? { backgroundColor: '#2E442A' } : {}}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-stone-400"
                  )} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100">
            <div className="px-4 py-3 rounded-xl bg-stone-50">
              <p className="text-xs text-stone-500 font-medium">San Pedro Garza García</p>
              <p className="text-xs text-stone-400">Nuevo León, México</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Quick Payment FAB */}
              <QuickPaymentFAB />

              {/* Payment Info Modal */}
              <PaymentInfoModal open={paymentInfoOpen} onClose={() => setPaymentInfoOpen(false)} />
            </div>
          );
        }