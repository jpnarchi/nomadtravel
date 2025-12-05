import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, Search, CreditCard, Calendar, ArrowUpDown, Users, Clock, CheckCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from '@/components/ui/EmptyState';

const PAYMENT_METHOD_LABELS = {
  transferencia: 'Transferencia',
  ms_beyond: 'MS Beyond',
  capital_one_blue: 'Capital One Blue',
  capital_one_green: 'Capital One Green',
  amex: 'Amex',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  otro: 'Otro'
};

export default function InternalPayments() {
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('pending');

  const queryClient = useQueryClient();

  const { data: supplierPayments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['allSupplierPayments'],
    queryFn: () => base44.entities.SupplierPayment.list('-date')
  });

  const { data: soldTrips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ['soldTrips'],
    queryFn: () => base44.entities.SoldTrip.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const isLoading = loadingPayments || loadingTrips;

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupplierPayment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSupplierPayments'] });
    }
  });

  // Create trips map for quick lookup
  const tripsMap = soldTrips.reduce((acc, trip) => {
    acc[trip.id] = trip;
    return acc;
  }, {});

  // Enrich payments with trip and agent info
  const enrichedPayments = supplierPayments.map(payment => {
    const trip = tripsMap[payment.sold_trip_id];
    const agentEmail = trip?.created_by || '';
    const agent = users.find(u => u.email === agentEmail);
    
    return {
      ...payment,
      trip_name: trip ? `${trip.client_name} - ${trip.destination}` : 'Viaje',
      agent_name: agent?.full_name || agentEmail || 'Sin asignar',
      agent_email: agentEmail
    };
  });

  // Get unique agents
  const uniqueAgents = [...new Set(enrichedPayments.map(p => p.agent_name))].filter(Boolean);

  // Get unique payment methods
  const uniqueMethods = [...new Set(supplierPayments.map(p => p.method))].filter(Boolean);

  // Filter and sort payments
  const filteredPayments = enrichedPayments
    .filter(p => {
      const matchesSearch = 
        (p.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.trip_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.agent_name || '').toLowerCase().includes(search.toLowerCase());
      const matchesAgent = filterAgent === 'all' || p.agent_name === filterAgent;
      const matchesMethod = filterMethod === 'all' || p.method === filterMethod;
      
      const paymentDate = p.date ? new Date(p.date) : null;
      const matchesDateFrom = !dateFrom || (paymentDate && paymentDate >= new Date(dateFrom));
      const matchesDateTo = !dateTo || (paymentDate && paymentDate <= new Date(dateTo));
      
      return matchesSearch && matchesAgent && matchesMethod && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Group by date
  const paymentsByDate = filteredPayments.reduce((acc, p) => {
    const dateKey = p.date || 'Sin fecha';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Pagos Internos</h1>
        <p className="text-stone-500 text-sm mt-1">Registro de pagos a proveedores por todos los agentes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total Pagos</p>
          <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Cantidad de Pagos</p>
          <p className="text-xl font-bold text-stone-800">{filteredPayments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Agentes Activos</p>
          <p className="text-xl font-bold text-purple-600">{uniqueAgents.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por proveedor, viaje o agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueAgents.map(agent => (
              <SelectItem key={agent} value={agent}>{agent}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueMethods.map(method => (
              <SelectItem key={method} value={method}>{PAYMENT_METHOD_LABELS[method] || method}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 rounded-xl"
          />
          <span className="text-stone-400">-</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 rounded-xl"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="rounded-xl"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          {sortOrder === 'asc' ? 'Más antiguas' : 'Más recientes'}
        </Button>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin pagos registrados"
          description="No hay pagos a proveedores que coincidan con los filtros"
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left p-3 font-semibold text-stone-600">Fecha</th>
                  <th className="text-left p-3 font-semibold text-stone-600">Agente</th>
                  <th className="text-left p-3 font-semibold text-stone-600">Viaje</th>
                  <th className="text-left p-3 font-semibold text-stone-600">Proveedor</th>
                  <th className="text-left p-3 font-semibold text-stone-600">Método</th>
                  <th className="text-right p-3 font-semibold text-stone-600">Monto</th>
                  <th className="text-left p-3 font-semibold text-stone-600">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-stone-800">
                        {payment.date 
                          ? format(new Date(payment.date), 'd MMM yyyy', { locale: es })
                          : '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
                          <Users className="w-3.5 h-3.5" style={{ color: '#2E442A' }} />
                        </div>
                        <span className="text-stone-700">{payment.agent_name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-700">{payment.trip_name}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{payment.supplier || '-'}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold" style={{ color: '#2E442A' }}>
                        ${(payment.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-500 text-xs truncate max-w-[150px] block">
                        {payment.notes || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50 border-t border-stone-200">
                <tr>
                  <td colSpan="5" className="p-3 text-right font-semibold text-stone-600">
                    Total:
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-lg font-bold" style={{ color: '#2E442A' }}>
                      ${totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}