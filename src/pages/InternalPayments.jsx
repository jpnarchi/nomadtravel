import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, Search, CreditCard, Calendar, ArrowUpDown, Users, Clock, CheckCircle, Edit2, Trash2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EmptyState from '@/components/ui/EmptyState';
import { toast } from "sonner";

const PAYMENT_METHOD_LABELS = {
  transferencia: 'Transferencia',
  ms_beyond: 'MS Beyond',
  capital_one_blue: 'Capital One Blue',
  capital_one_green: 'Capital One Green',
  amex: 'Amex',
  tarjeta_cliente: 'Tarjeta de Cliente',
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
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['allSupplierPayments'] });
      await queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      setEditingPayment(null);
      toast.success('Pago actualizado');
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => base44.entities.SupplierPayment.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['allSupplierPayments'] });
      await queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      setDeleteConfirm(null);
      toast.success('Pago eliminado');
    }
  });

  // Create trips map for quick lookup
  const tripsMap = soldTrips.reduce((acc, trip) => {
    acc[trip.id] = trip;
    return acc;
  }, {});

  // Enrich payments with trip and agent info
  // Exclude payments made with 'tarjeta_cliente' from internal payments view
  const enrichedPayments = supplierPayments
    .filter(payment => payment.method !== 'tarjeta_cliente')
    .map(payment => {
    const trip = tripsMap[payment.sold_trip_id];
    const agentEmail = payment.created_by || '';
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

  // Split by confirmed status
  const pendingPayments = filteredPayments.filter(p => !p.confirmed);
  const confirmedPayments = filteredPayments.filter(p => p.confirmed);

  // Calculate totals
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleToggleConfirmed = (payment, isConfirmed) => {
    updatePaymentMutation.mutate({ id: payment.id, data: { confirmed: isConfirmed } });
  };

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Pagos Hechos</p>
          <p className="text-xl font-bold text-orange-600">${totalPending.toLocaleString()}</p>
          <p className="text-xs text-stone-400">{pendingPayments.length} pagos</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Pagos Confirmados</p>
          <p className="text-xl font-bold text-green-600">${totalConfirmed.toLocaleString()}</p>
          <p className="text-xs text-stone-400">{confirmedPayments.length} pagos</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Total Pagos</p>
          <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${(totalPending + totalConfirmed).toLocaleString()}</p>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100 rounded-xl p-1">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white">
            <Clock className="w-4 h-4 mr-2" /> Pagos Hechos ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="rounded-lg data-[state=active]:bg-white">
            <CheckCircle className="w-4 h-4 mr-2" /> Pagos Confirmados ({confirmedPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {renderPaymentsTable(pendingPayments, totalPending, false)}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-4">
          {renderPaymentsTable(confirmedPayments, totalConfirmed, true)}
        </TabsContent>
      </Tabs>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pago a Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Input
                value={editFormData.supplier || ''}
                onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={editFormData.date || ''}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                value={editFormData.amount || ''}
                onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Pago</Label>
              <Select
                value={editFormData.payment_type || 'neto'}
                onValueChange={(value) => setEditFormData({ ...editFormData, payment_type: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neto">Neto</SelectItem>
                  <SelectItem value="bruto">Bruto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <Select
                value={editFormData.method || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, method: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="ms_beyond">MS Beyond</SelectItem>
                  <SelectItem value="capital_one_blue">Capital One Blue</SelectItem>
                  <SelectItem value="capital_one_green">Capital One Green</SelectItem>
                  <SelectItem value="amex">AMEX</SelectItem>
                  <SelectItem value="tarjeta_cliente">Tarjeta de Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingPayment(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => updatePaymentMutation.mutate({ id: editingPayment.id, data: editFormData })}
              disabled={updatePaymentMutation.isPending}
              className="rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {updatePaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el pago de <strong>${deleteConfirm?.amount?.toLocaleString()}</strong> a <strong>{deleteConfirm?.supplier}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePaymentMutation.mutate(deleteConfirm.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderPaymentsTable(payments, total, isConfirmedTab) {
    if (payments.length === 0) {
      return (
        <EmptyState
          icon={CreditCard}
          title={isConfirmedTab ? "Sin pagos confirmados" : "Sin pagos hechos"}
          description={isConfirmedTab ? "No hay pagos confirmados aún" : "No hay pagos pendientes de confirmar"}
        />
      );
    }

    return (
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
                <th className="text-center p-3 font-semibold text-stone-600">Estatus</th>
                <th className="text-center p-3 font-semibold text-stone-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payments.map((payment) => (
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
                  <td className="p-3 text-center">
                    <Select 
                      value={payment.confirmed ? 'confirmed' : 'pending'} 
                      onValueChange={(value) => handleToggleConfirmed(payment, value === 'confirmed')}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Hecho</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingPayment(payment);
                          setEditFormData({
                            supplier: payment.supplier,
                            date: payment.date,
                            amount: payment.amount,
                            method: payment.method,
                            payment_type: payment.payment_type || 'neto',
                            notes: payment.notes || ''
                          });
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteConfirm(payment)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
                    ${total.toLocaleString()}
                  </span>
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }
}