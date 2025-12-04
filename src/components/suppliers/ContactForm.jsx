import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function ContactForm({ open, onClose, contact, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    timezone: '',
    notes: '',
    priority: 5
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        position: contact.position || '',
        email: contact.email || '',
        phone: contact.phone || '',
        timezone: contact.timezone || '',
        notes: contact.notes || '',
        priority: contact.priority || 5
      });
    } else {
      setFormData({ name: '', position: '', email: '', phone: '', timezone: '', notes: '', priority: 5 });
    }
  }, [contact, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#2E442A' }}>{contact ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Puesto</Label>
            <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono / WhatsApp</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl" placeholder="+52..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Input value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className="rounded-xl" placeholder="CST, EST..." />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={String(formData.priority)} onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Emergencia</SelectItem>
                  <SelectItem value="2">2 - Alta</SelectItem>
                  <SelectItem value="3">3 - Media</SelectItem>
                  <SelectItem value="4">4 - Baja</SelectItem>
                  <SelectItem value="5">5 - General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="rounded-xl resize-none" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl text-white" style={{ backgroundColor: '#2E442A' }}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contact ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}