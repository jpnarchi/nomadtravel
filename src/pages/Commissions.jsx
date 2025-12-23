import React, { useState, useRef, useEffect, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewModeContext } from '@/Layout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Loader2, Search, Filter, DollarSign, 
  Check, X, Download, FileText, Trash2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import AgentInvoiceGenerator from '@/components/commissions/AgentInvoiceGenerator';

const BOOKED_BY_LABELS = {
  montecito: 'Montecito',
  iata_nomad: 'IATA Nomad'
};

const RESERVED_BY_LABELS = {
  virtuoso: 'Virtuoso',
  preferred_partner: 'Preferred Partner',
  tbo: 'TBO',
  expedia_taap: 'Expedia TAAP',
  ratehawk: 'RateHawk',
  tablet_hotels: 'Tablet Hotels',
  dmc: 'DMC',
  otro: 'Otro'
};

const SERVICE_TYPE_LABELS = {
  hotel: 'Hotel',
  vuelo: 'Vuelo',
  traslado: 'Traslado',
  tour: 'Tour',
  crucero: 'Crucero',
  tren: 'Tren',
  dmc: 'DMC',
  otro: 'Otro'
};

const CRUISE_PROVIDER_LABELS = {
  creative_travel: 'Creative Travel',
  directo: 'Directo',
  international_cruises: 'International Cruises',
  cruceros_57: 'Cruceros 57',
  pema: 'PeMA'
};

export default function Commissions() {
  const { viewMode } = useContext(ViewModeContext);
  const [search, setSearch] = useState('');
  const [filterBookedBy, setFilterBookedBy] = useState('all');
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [activeTab, setActiveTab] = useState('pendientes');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editValues, setEditValues] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin' && viewMode === 'admin';

  const { data: allServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['allServices', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      const allTrips = isAdmin 
        ? await base44.entities.SoldTrip.list()
        : await base44.entities.SoldTrip.filter({ created_by: user.email });
      const tripIds = allTrips.map(t => t.id);
      const allSvcs = await base44.entities.TripService.list();
      return allSvcs.filter(s => tripIds.includes(s.sold_trip_id));
    },
    enabled: !!user && !userLoading,
    refetchOnWindowFocus: true
  });

  const { data: allSoldTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['soldTrips', user?.email, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      if (isAdmin) return base44.entities.SoldTrip.list();
      return base44.entities.SoldTrip.filter({ created_by: user.email });
    },
    enabled: !!user && !userLoading,
    refetchOnWindowFocus: true
  });

  const soldTrips = allSoldTrips;
  const services = allServices;

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TripService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
    }
  });

  const updateSoldTripMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SoldTrip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.TripService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allServices'] });
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
      setDeleteConfirm(null);
    }
  });

  const togglePaid = (service, newValue) => {
    updateServiceMutation.mutate({
      id: service.id,
      data: { commission_paid: newValue }
    });
  };

  const startEditing = (service) => {
    setEditingService(service.id);
    setEditValues({
      commission: service.commission || 0,
      commission_payment_date: service.commission_payment_date || ''
    });
  };

  const cancelEditing = () => {
    setEditingService(null);
    setEditValues({});
  };

  const saveEditing = (service) => {
    const commission = parseFloat(editValues.commission);
    if (isNaN(commission) || commission < 0) {
      alert('El monto debe ser un número válido mayor o igual a cero');
      return;
    }

    if (editValues.commission_payment_date && isNaN(new Date(editValues.commission_payment_date).getTime())) {
      alert('La fecha no es válida');
      return;
    }

    updateServiceMutation.mutate({
      id: service.id,
      data: {
        commission: commission,
        commission_payment_date: editValues.commission_payment_date || null
      }
    });

    setEditingService(null);
    setEditValues({});
  };

  // Create a map of sold trips for quick lookup
  const tripsMap = soldTrips.reduce((acc, trip) => {
    acc[trip.id] = trip;
    return acc;
  }, {});

  // Filter and sort services
  const allFilteredServices = services
    .filter(s => s.commission > 0) // Only show services with commission
    .filter(s => {
      const trip = tripsMap[s.sold_trip_id];
      const clientName = trip?.client_name || '';
      const matchesSearch = clientName.toLowerCase().includes(search.toLowerCase()) ||
                           (s.hotel_name || '').toLowerCase().includes(search.toLowerCase()) ||
                           (s.airline || '').toLowerCase().includes(search.toLowerCase());
      const matchesBookedBy = filterBookedBy === 'all' || s.booked_by === filterBookedBy;
      return matchesSearch && matchesBookedBy;
    })
    .sort((a, b) => {
      const dateA = a.commission_payment_date ? new Date(a.commission_payment_date) : new Date(0);
      const dateB = b.commission_payment_date ? new Date(b.commission_payment_date) : new Date(0);
      return dateA - dateB;
    });

  // Filter by tab (paid/unpaid)
  const filteredServices = allFilteredServices.filter(s => 
    activeTab === 'pendientes' ? !s.commission_paid : s.commission_paid
  );

  // Calculate commissions
  const totalCommissionsFull = allFilteredServices.reduce((sum, s) => sum + (s.commission || 0), 0); // 100% comisiones totales
  const agentCommissionRate = 0.5; // 50% para el agente
  const agentCommissionTotal = totalCommissionsFull * agentCommissionRate; // Comisión a pagar al agente
  const paidCommissions = allFilteredServices.filter(s => s.commission_paid).reduce((sum, s) => sum + ((s.commission || 0) * agentCommissionRate), 0);
  const pendingCommissions = agentCommissionTotal - paidCommissions;

  const getServiceName = (service) => {
    switch (service.service_type) {
      case 'hotel': return service.hotel_name || 'Hotel';
      case 'vuelo': return `${service.airline || 'Vuelo'} ${service.route || ''}`;
      case 'traslado': return `${service.transfer_origin || ''} → ${service.transfer_destination || ''}`;
      case 'tour': return service.tour_name || 'Tour';
      case 'crucero': return `${service.cruise_ship || 'Crucero'} - ${service.cruise_itinerary || ''}`;
      case 'tren': return service.train_operator || service.train_route || 'Tren';
      case 'dmc': return service.dmc_name || service.dmc_services || service.dmc_destination || 'DMC';
      default: return service.other_name || 'Servicio';
    }
  };

  const isLoading = servicesLoading || tripsLoading || userLoading;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Comisiones</h1>
          <p className="text-stone-500 text-sm mt-1">Control de comisiones por servicio</p>
        </div>
        <Button
          onClick={() => setInvoiceDialogOpen(true)}
          disabled={selectedServices.length === 0}
          className="text-white"
          style={{ backgroundColor: '#2E442A' }}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generar Factura ({selectedServices.length})
        </Button>
      </div>

      {/* Instructions Box */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
        <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
          <span className="text-blue-600">ℹ️</span> Cómo Funcionan las Comisiones
        </h3>
        <div className="space-y-3 text-sm text-stone-700">
          <div className="bg-white rounded-lg p-3">
            <p className="font-semibold text-green-700 mb-1">✓ Comisiones Netas:</p>
            <p>Se pagan a la agencia en cuanto termina el viaje.</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="font-semibold text-amber-700 mb-1">⏱ Comisiones Brutas:</p>
            <p>Normalmente tardan <span className="font-bold">2 a 3 meses</span> en ser pagadas por el proveedor después de finalizado el viaje.</p>
          </div>
          <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
            <p className="font-semibold text-blue-700 mb-1">📋 Proceso de Facturación:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Usa el <span className="font-semibold">check mark</span> para seleccionar comisiones</li>
              <li>Haz clic en <span className="font-semibold">"Generar Factura"</span> para crear tu factura</li>
              <li>Entrega la factura a <span className="font-semibold">Administración Nomad</span></li>
              <li>Administración se encarga de pagar la comisión al agente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Comisiones Totales</p>
          <p className="text-xl font-bold text-stone-700">${totalCommissionsFull.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">100%</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Comisión a Pagar al Agente</p>
          <p className="text-xl font-bold" style={{ color: '#2E442A' }}>${agentCommissionTotal.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">{agentCommissionRate * 100}% del total</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Comisión Pagada</p>
          <p className="text-xl font-bold text-green-600">${paidCommissions.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">Ya cobrado</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
          <p className="text-xs text-stone-400">Pendiente de Cobro</p>
          <p className="text-xl font-bold text-orange-500">${pendingCommissions.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1">Por cobrar</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterBookedBy} onValueChange={setFilterBookedBy}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Bookeado por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="montecito">Montecito</SelectItem>
            <SelectItem value="iata_nomad">IATA Nomad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pendientes">
            Pendientes ({allFilteredServices.filter(s => !s.commission_paid).length})
          </TabsTrigger>
          <TabsTrigger value="pagadas">
            Pagadas a agente ({allFilteredServices.filter(s => s.commission_paid).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold text-stone-600 w-12">
                  <Checkbox
                    checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices(filteredServices.map(s => s.id));
                      } else {
                        setSelectedServices([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-3 font-semibold text-stone-600 w-24">Pagada a agente</th>
                <th className="text-left p-3 font-semibold text-stone-600 w-32">Pagado a agencia</th>
                <th className="text-left p-3 font-semibold text-stone-600">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-600">Servicio</th>
                <th className="text-left p-3 font-semibold text-stone-600">Tipo</th>
                <th className="text-left p-3 font-semibold text-stone-600">Bookeado por</th>
                <th className="text-left p-3 font-semibold text-stone-600">Reservado por</th>
                <th className="text-left p-3 font-semibold text-stone-600 w-32">Fecha Estimada Pago</th>
                <th className="text-right p-3 font-semibold text-stone-600 w-32">Comisión</th>
                <th className="text-center p-3 font-semibold text-stone-600 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredServices.map((service) => {
              const trip = tripsMap[service.sold_trip_id];
              const isEditing = editingService === service.id;
              const isPaid = service.commission_paid || false;
              const canEdit = isAdmin || !isPaid;
              
              return (
                <tr key={service.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServices([...selectedServices, service.id]);
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== service.id));
                        }
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <Select
                      value={isPaid ? 'yes' : 'no'}
                      onValueChange={(value) => togglePaid(service, value === 'yes')}
                    >
                      <SelectTrigger className={`h-8 w-20 text-xs ${isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-stone-50'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Sí</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <Select
                        value={service.paid_to_agency ? 'yes' : 'no'}
                        onValueChange={(value) => {
                          const newValue = value === 'yes';
                          updateServiceMutation.mutate({
                            id: service.id,
                            data: { 
                              paid_to_agency: newValue,
                              paid_to_agency_date: newValue ? (service.paid_to_agency_date || new Date().toISOString().split('T')[0]) : null
                            }
                          });
                        }}
                      >
                        <SelectTrigger className={`h-8 w-20 text-xs ${service.paid_to_agency ? 'bg-green-50 text-green-700 border-green-200' : 'bg-stone-50'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Sí</SelectItem>
                        </SelectContent>
                      </Select>
                      {service.paid_to_agency && service.paid_to_agency_date && (
                        <p className="text-xs text-green-600 font-medium">
                          {format(new Date(service.paid_to_agency_date), 'd MMM yy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </td>
                    <td className="p-3">
                      <span className="font-medium text-stone-800">{trip?.client_name || '-'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-700">{getServiceName(service)}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {SERVICE_TYPE_LABELS[service.service_type] || service.service_type}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-600">
                        {BOOKED_BY_LABELS[service.booked_by] || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-stone-600">
                        {RESERVED_BY_LABELS[service.reserved_by] || service.flight_consolidator || CRUISE_PROVIDER_LABELS[service.cruise_provider] || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editValues.commission_payment_date || ''}
                          onChange={(e) => setEditValues({...editValues, commission_payment_date: e.target.value})}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <div className="space-y-1">
                          <span 
                            className={`text-stone-500 block ${canEdit ? 'cursor-pointer hover:text-blue-600' : 'cursor-not-allowed opacity-60'}`}
                            onClick={() => canEdit && startEditing(service)}
                          >
                            {service.commission_payment_date 
                              ? format(new Date(service.commission_payment_date), 'd MMM yy', { locale: es })
                              : '-'}
                          </span>
                          {service.commission_payment_date && service.payment_type === 'bruto' && (
                            <p className="text-xs text-amber-600">
                              (~2-3 meses)
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues.commission || 0}
                          onChange={(e) => setEditValues({...editValues, commission: e.target.value})}
                          className="h-8 text-xs text-right"
                        />
                      ) : (
                        <span 
                          className={`font-semibold ${service.commission_paid ? 'text-green-600' : 'text-stone-800'} ${canEdit ? 'cursor-pointer hover:text-blue-600' : 'cursor-not-allowed opacity-60'}`}
                          onClick={() => canEdit && startEditing(service)}
                        >
                          ${(service.commission || 0).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => saveEditing(service)}
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditing}
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(service)}
                          className="h-8 w-8 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p>No hay comisiones que mostrar</p>
          </div>
        )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Generator Dialog */}
      <AgentInvoiceGenerator
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        services={filteredServices.filter(s => selectedServices.includes(s.id))}
        soldTrips={soldTrips}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comisión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el servicio y su comisión asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteServiceMutation.mutate(deleteConfirm.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}