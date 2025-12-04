import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function InternalCommissionForm({ open, onClose, commission, users, soldTrips, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    agent_email: '',
    agent_name: '',
    sold_trip_id: '',
    sold_trip_name: '',
    service_provider: '',
    estimated_amount: '',
    estimated_payment_date: '',
    iata_used: 'nomad',
    status: 'pendiente',
    received_date: '',
    received_amount: '',
    notes: ''
  });

  useEffect(() => {
    if (commission) {
      setFormData({
        agent_email: commission.agent_email || '',
        agent_name: commission.agent_name || '',
        sold_trip_id: commission.sold_trip_id || '',
        sold_trip_name: commission.sold_trip_name || '',
        service_provider: commission.service_provider || '',
        estimated_amount: commission.estimated_amount || '',
        estimated_payment_date: commission.estimated_payment_date || '',
        iata_used: commission.iata_used || 'nomad',
        status: commission.status || 'pendiente',
        received_date: commission.received_date || '',
        received_amount: commission.received_amount || '',
        notes: commission.notes || ''
      });
    } else {
      setFormData({
        agent_email: '',
        agent_name: '',
        sold_trip_id: '',
        sold_trip_name: '',
        service_provider: '',
        estimated_amount: '',
        estimated_payment_date: '',
        iata_used: 'nomad',
        status: 'pendiente',
        received_date: '',
        received_amount: '',
        notes: ''
      });
    }
  }, [commission, open]);

  const handleUserChange = (email) => {
    const user = users.find(u => u.email === email);
    setFormData({
      ...formData,
      agent_email: email,
      agent_name: user?.full_name || email
    });
  };

  const handleTripChange = (tripId) => {
    const trip = soldTrips.find(t => t.id === tripId);
    setFormData({
      ...formData,
      sold_trip_id: tripId,
      sold_trip_name: trip ? `${trip.client_name} - ${trip.destination}` : ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      estimated_amount: parseFloat(formData.estimated_amount) || 0,
      received_amount: formData.received_amount ? parseFloat(formData.received_amount) : null
    });
  };

  // Calculate preview of commissions
  const previewCommissions = () => {
    const received = parseFloat(formData.received_amount) || 0;
    if (!received) return null;
    
    if (formData.iata_used === 'montecito') {
      return { agent: received * 0.50, nomad: received * 0.35 };
    } else {
      return { agent: received * 0.50, nomad: received * 0.50 };
    }
  };

  const preview = previewCommissions();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {commission ? 'Editar Comisión' : 'Nueva Comisión Interna'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Agent */}
          <div className="space-y-2">
            <Label>Agente *</Label>
            <Select value={formData.agent_email} onValueChange={handleUserChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleccionar agente" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip */}
          <div className="space-y-2">
            <Label>Viaje Vendido *</Label>
            <Select value={formData.sold_trip_id} onValueChange={handleTripChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleccionar viaje" />
              </SelectTrigger>
              <SelectContent>
                {soldTrips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.client_name} - {trip.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Provider */}
          <div className="space-y-2">
            <Label>Proveedor / Servicio</Label>
            <Input
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: Hotel Marriott, Vuelo Delta..."
            />
          </div>

          {/* Estimated Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Comisión Estimada *</Label>
              <Input
                type="number"
                value={formData.estimated_amount}
                onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                required
                className="rounded-xl"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Est. de Pago</Label>
              <Input
                type="date"
                value={formData.estimated_payment_date}
                onChange={(e) => setFormData({ ...formData, estimated_payment_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* IATA & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IATA Usado *</Label>
              <Select value={formData.iata_used} onValueChange={(v) => setFormData({ ...formData, iata_used: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="montecito">IATA Montecito</SelectItem>
                  <SelectItem value="nomad">IATA Nomad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estatus *</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="recibida">Recibida</SelectItem>
                  <SelectItem value="pagada_agente">Pagada al Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Received Amount & Date (when not pending) */}
          {formData.status !== 'pendiente' && (
            <div className="p-4 bg-blue-50 rounded-xl space-y-4">
              <p className="text-sm font-medium text-blue-800">Datos de Comisión Recibida</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-700">Monto Recibido</Label>
                  <Input
                    type="number"
                    value={formData.received_amount}
                    onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
                    className="rounded-xl"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-700">Fecha Recibida</Label>
                  <Input
                    type="date"
                    value={formData.received_date}
                    onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              {/* Preview Calculations */}
              {preview && (
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600 mb-2">
                    Cálculo ({formData.iata_used === 'montecito' ? 'Montecito: 50% Agente, 35% Nomad' : 'Nomad: 50% Agente, 50% Nomad'}):
                  </p>
                  <div className="flex gap-4">
                    <div className="flex-1 p-2 bg-white rounded-lg text-center">
                      <p className="text-xs text-stone-500">Agente</p>
                      <p className="font-bold" style={{ color: '#2E442A' }}>${preview.agent.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 p-2 bg-white rounded-lg text-center">
                      <p className="text-xs text-stone-500">Nomad</p>
                      <p className="font-bold text-purple-600">${preview.nomad.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {commission ? 'Actualizar' : 'Crear Comisión'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}