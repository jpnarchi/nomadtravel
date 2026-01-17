import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Users, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function GroupMembersList({
  members = [],
  onCreate,
  onUpdate,
  onDelete,
  isLoading
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'adulto',
    is_organizer: false,
    is_payment_responsible: true,
    status: 'activo',
    email: '',
    phone: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'adulto',
      is_organizer: false,
      is_payment_responsible: true,
      status: 'activo',
      email: '',
      phone: '',
      notes: ''
    });
    setEditingMember(null);
  };

  const handleOpen = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name || '',
        type: member.type || 'adulto',
        is_organizer: member.is_organizer || false,
        is_payment_responsible: member.is_payment_responsible !== false,
        status: member.status || 'activo',
        email: member.email || '',
        phone: member.phone || '',
        notes: member.notes || ''
      });
    } else {
      resetForm();
    }
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingMember) {
      onUpdate(editingMember.id, formData);
    } else {
      onCreate(formData);
    }

    setFormOpen(false);
    resetForm();
  };

  const activeMembers = members.filter(m => m.status === 'activo');
  const cancelledMembers = members.filter(m => m.status === 'cancelado');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: '#2E442A' }} />
            Miembros del Grupo
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Miembros activos: {activeMembers.length} {cancelledMembers.length > 0 && `• Cancelados: ${cancelledMembers.length}`}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => handleOpen()}
          className="text-white rounded-xl"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar Miembro
        </Button>
      </div>

      {/* Active Members */}
      {activeMembers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-stone-500 uppercase">Activos</h4>
          {activeMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white p-3 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-800">{member.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {member.type}
                      </Badge>
                      {member.is_organizer && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs border-0">
                          Organizador
                        </Badge>
                      )}
                      {!member.is_payment_responsible && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                          Paga organizador
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      {member.email && (
                        <>
                          <span>{member.email}</span>
                          <span className="text-stone-300">•</span>
                        </>
                      )}
                      {member.phone && <span>{member.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpen(member)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => onDelete(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {member.notes && (
                <p className="text-xs text-stone-600 mt-2 pl-13">{member.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancelled Members */}
      {cancelledMembers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-stone-400 uppercase">Cancelados</h4>
          {cancelledMembers.map((member) => (
            <div
              key={member.id}
              className="bg-stone-50 p-3 rounded-xl border border-stone-200 opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-stone-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-600 line-through">{member.name}</p>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        Cancelado
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpen(member)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {members.length === 0 && (
        <div className="text-center py-8 text-stone-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <p>No hay miembros en el grupo</p>
          <p className="text-sm mt-1">Agrega los participantes del viaje grupal</p>
        </div>
      )}

      {/* Member Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Editar Miembro' : 'Agregar Miembro'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adulto">Adulto</SelectItem>
                    <SelectItem value="niño">Niño</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estatus</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="organizer"
                  checked={formData.is_organizer}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_organizer: checked })}
                />
                <label htmlFor="organizer" className="text-sm font-medium cursor-pointer">
                  Es el organizador del grupo
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payment_responsible"
                  checked={formData.is_payment_responsible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_payment_responsible: checked })}
                />
                <label htmlFor="payment_responsible" className="text-sm font-medium cursor-pointer">
                  Responsable de su propio pago
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono (opcional)</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+52 123 456 7890"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim() || isLoading}
                className="text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                {editingMember ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
