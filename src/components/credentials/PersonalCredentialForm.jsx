import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'banco', label: 'Banco' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
  { value: 'red_social', label: 'Red Social' },
  { value: 'email', label: 'Email' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'compras', label: 'Compras Online' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'salud', label: 'Salud' },
  { value: 'gobierno', label: 'Gobierno' },
  { value: 'educacion', label: 'Educación' },
  { value: 'otro', label: 'Otro' }
];

export default function PersonalCredentialForm({ open, onClose, credential, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'otro',
    website: '',
    username: '',
    password: '',
    notes: '',
    security_question: '',
    security_answer: ''
  });

  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name || '',
        category: credential.category || 'otro',
        website: credential.website || '',
        username: credential.username || '',
        password: credential.password || '',
        notes: credential.notes || '',
        security_question: credential.security_question || '',
        security_answer: credential.security_answer || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'otro',
        website: '',
        username: '',
        password: '',
        notes: '',
        security_question: '',
        security_answer: ''
      });
    }
  }, [credential, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{credential ? 'Editar Contraseña' : 'Nueva Contraseña Personal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Netflix, Gmail, Chase Bank..."
              required
            />
          </div>

          <div>
            <Label>Categoría *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sitio Web</Label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://ejemplo.com"
            />
          </div>

          <div>
            <Label>Usuario / Email</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label>Pregunta de Seguridad</Label>
            <Input
              value={formData.security_question}
              onChange={(e) => setFormData({ ...formData, security_question: e.target.value })}
              placeholder="¿Cuál es el nombre de tu primera mascota?"
            />
          </div>

          <div>
            <Label>Respuesta de Seguridad</Label>
            <Input
              value={formData.security_answer}
              onChange={(e) => setFormData({ ...formData, security_answer: e.target.value })}
              placeholder="Respuesta..."
            />
          </div>

          <div>
            <Label>Notas Privadas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional que quieras recordar..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {credential ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}