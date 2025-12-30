import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, FileText, Image, Link as LinkIcon } from 'lucide-react';
import { supabaseAPI } from '@/api/supabaseClient';
import { toast } from "sonner";

const CATEGORIES = [
  { value: 'guia', label: 'Guía' },
  { value: 'manual', label: 'Manual' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' },
  { value: 'pdf', label: 'PDF' },
  { value: 'notas', label: 'Notas' },
  { value: 'otro', label: 'Otro' }
];

const PROVIDER_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'dmc', label: 'DMC' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'aerolinea', label: 'Aerolínea' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'cruise', label: 'Crucero' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'otro', label: 'Otro' }
];

const DESTINATIONS = [
  'General', 'Sudeste Asiático', 'Asia Oriental', 'Asia del Sur', 'Medio Oriente',
  'Europa Occidental', 'Europa del Este', 'Europa del Norte', 'Europa del Sur',
  'África del Norte', 'África del Este', 'África del Sur', 'África Occidental',
  'Oceanía / Pacífico', 'Norteamérica', 'Caribe', 'Centroamérica', 'Sudamérica',
  'Islas del Índico', 'Islas del Mediterráneo'
];

export default function LearningForm({ open, onClose, material, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    destination: '',
    provider_type: 'general',
    description: '',
    external_link: '',
    pdf_files: [],
    images: [],
    tags: []
  });
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title || '',
        category: material.category || '',
        destination: material.destination || '',
        provider_type: material.provider_type || 'general',
        description: material.description || '',
        external_link: material.external_link || '',
        pdf_files: material.pdf_files || [],
        images: material.images || [],
        tags: material.tags || []
      });
    } else {
      setFormData({
        title: '',
        category: '',
        destination: '',
        provider_type: 'general',
        description: '',
        external_link: '',
        pdf_files: [],
        images: [],
        tags: []
      });
    }
  }, [material, open]);

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      const folderPath = type === 'pdf' ? 'learning-materials/pdfs' : 'learning-materials/images';

      for (const file of files) {
        const { file_url } = await supabaseAPI.storage.uploadFile(file, 'documents', folderPath);
        uploadedUrls.push(file_url);
      }

      if (type === 'pdf') {
        setFormData(prev => ({ ...prev, pdf_files: [...prev.pdf_files, ...uploadedUrls] }));
      } else {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }
      toast.success('Archivos subidos');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error al subir archivos. Verifica que el storage esté configurado.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (type, index) => {
    if (type === 'pdf') {
      setFormData(prev => ({ ...prev, pdf_files: prev.pdf_files.filter((_, i) => i !== index) }));
    } else {
      setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {material ? 'Editar Material' : 'Nuevo Material de Aprendizaje'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="rounded-xl"
              placeholder="Nombre del material"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Tipo de Proveedor</Label>
              <Select value={formData.provider_type} onValueChange={(v) => setFormData({ ...formData, provider_type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Destino</Label>
            <Select value={formData.destination} onValueChange={(v) => setFormData({ ...formData, destination: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción / Notas</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-xl resize-none"
              rows={4}
              placeholder="Descripción del material, notas importantes..."
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link externo
            </Label>
            <Input
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              className="rounded-xl"
              placeholder="https://..."
            />
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Archivos PDF
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.pdf_files.map((url, i) => (
                <div key={i} className="flex items-center gap-1 bg-stone-100 rounded-lg px-2 py-1 text-sm">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">PDF {i + 1}</span>
                  <button type="button" onClick={() => removeFile('pdf', i)}>
                    <X className="w-3 h-3 text-stone-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-stone-300 transition-colors">
              <Upload className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500">Subir PDF</span>
              <input type="file" accept=".pdf" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={uploading} />
            </label>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Imágenes
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  <button 
                    type="button" 
                    onClick={() => removeFile('image', i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-stone-300 transition-colors">
              <Upload className="w-4 h-4 text-stone-400" />
              <span className="text-sm text-stone-500">Subir imágenes</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'image')} disabled={uploading} />
            </label>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {formData.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="rounded-xl"
                placeholder="Agregar tag..."
              />
              <Button type="button" variant="outline" onClick={addTag} className="rounded-xl">Agregar</Button>
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo archivos...
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading || uploading} className="rounded-xl text-white" style={{ backgroundColor: '#2E442A' }}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {material ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}