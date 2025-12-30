import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from 'lucide-react';
import { supabaseAPI } from '@/api/supabaseClient';

const DOC_TYPES = [
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'visa', label: 'Visa' }
];

export default function TravelDocumentForm({ open, onClose, document, clientId, tripId, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    document_type: 'pasaporte',
    name: '',
    file_url: '',
    expiry_date: '',
    country: '',
    document_number: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        document_type: document.document_type || 'pasaporte',
        name: document.name || '',
        file_url: document.file_url || '',
        expiry_date: document.expiry_date || '',
        country: document.country || '',
        document_number: document.document_number || '',
        notes: document.notes || ''
      });
    } else {
      setFormData({
        document_type: 'pasaporte',
        name: '',
        file_url: '',
        expiry_date: '',
        country: '',
        document_number: '',
        notes: ''
      });
    }
  }, [document, open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await supabaseAPI.storage.uploadFile(file, 'documents', 'travel-documents');
      setFormData({ ...formData, file_url, name: formData.name || file.name });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      client_id: clientId,
      trip_id: tripId || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {document ? 'Editar Documento' : 'Nuevo Documento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Tipo de Documento *</Label>
            <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Documento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="rounded-xl"
              placeholder="Ej: Pasaporte Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="rounded-xl"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {uploading && <Loader2 className="w-5 h-5 animate-spin text-stone-400" />}
            </div>
            {formData.file_url && (
              <a 
                href={formData.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Ver archivo actual
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_number">Número de Documento</Label>
            <Input
              id="document_number"
              value={formData.document_number}
              onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
              className="rounded-xl"
            />
          </div>

          {formData.document_type === 'visa' && (
            <div className="space-y-2">
              <Label htmlFor="country">País de la Visa</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="rounded-xl"
                placeholder="Ej: Estados Unidos"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiry_date">Fecha de Vencimiento</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || uploading}
              className="rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {document ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}