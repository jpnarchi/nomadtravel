import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DOC_TYPES = [
  { value: 'tarifario', label: 'Tarifario' },
  { value: 'politicas', label: 'Políticas' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'otro', label: 'Otro' }
];

export default function DocumentForm({ open, onClose, document, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'otro',
    file_url: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        type: document.type || 'otro',
        file_url: document.file_url || '',
        notes: document.notes || ''
      });
    } else {
      setFormData({ name: '', type: 'otro', file_url: '', notes: '' });
    }
  }, [document, open]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url, name: formData.name || file.name });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#2E442A' }}>{document ? 'Editar Documento' : 'Nuevo Documento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nombre del documento *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Archivo</Label>
            <div className="flex gap-2">
              <Input value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} className="rounded-xl flex-1" placeholder="URL o subir archivo" />
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                <Button type="button" variant="outline" className="rounded-xl" disabled={uploading} asChild>
                  <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                </Button>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="rounded-xl resize-none" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading || uploading} className="rounded-xl text-white" style={{ backgroundColor: '#2E442A' }}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {document ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}