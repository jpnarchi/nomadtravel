import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from 'lucide-react';

const CATEGORIES = [
  { value: 'portal_agente', label: 'Portal de Agente' },
  { value: 'aerolinea', label: 'Aerolínea' },
  { value: 'hotel', label: 'Hotel / Cadena' },
  { value: 'plataforma', label: 'Plataforma (TBO, RateHawk, etc.)' },
  { value: 'dmc', label: 'DMC' },
  { value: 'consolidador', label: 'Consolidador' },
  { value: 'otro', label: 'Otro' }
];

export default function CredentialForm({ open, onClose, credential, onSave, isLoading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    website: '',
    username: '',
    password: '',
    agent_id: '',
    notes: ''
  });

  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name || '',
        category: credential.category || '',
        website: credential.website || '',
        username: credential.username || '',
        password: credential.password || '',
        agent_id: credential.agent_id || '',
        notes: credential.notes || ''
      });
    } else {
      setFormData({
        name: '',
        category: '',
        website: '',
        username: '',
        password: '',
        agent_id: '',
        notes: ''
      });
    }
    setShowPassword(false);
  }, [credential, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {credential ? 'Editar Credencial' : 'Nueva Credencial'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nombre del sitio/servicio *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="rounded-xl"
              placeholder="Ej: Virtuoso, TBO, Marriott Bonvoy"
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>URL del sitio</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="rounded-xl"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Usuario / Email</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="rounded-xl"
              placeholder="usuario@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ID de Agente / Número de cuenta</Label>
            <Input
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              className="rounded-xl"
              placeholder="Ej: AGT-12345"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl resize-none"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl text-white" style={{ backgroundColor: '#2E442A' }}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {credential ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}