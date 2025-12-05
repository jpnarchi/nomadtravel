import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";
import FamDetailsInput from './FamDetailsInput';

const CONTENT_TYPES = [
  { value: 'fam_trip', label: 'FAM Trip' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'destino', label: 'Destino' },
  { value: 'aerolinea', label: 'Aerolínea' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'otro', label: 'Otro' },
];

const PROVIDER_TYPES = [
  { value: 'dmc', label: 'DMC' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'aerolinea', label: 'Aerolínea' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'otro', label: 'Otro' },
];

const FAM_TYPES = [
  { value: 'hotelero', label: 'Hotelero' },
  { value: 'dmc', label: 'DMC' },
  { value: 'aerolinea', label: 'Aerolínea' },
  { value: 'destino', label: 'Destino' },
  { value: 'crucero', label: 'Crucero' },
  { value: 'mixto', label: 'Mixto' },
];

const REVIEW_TAGS = [
  'Servicio', 'Calidad', 'Logística', 'Seguridad', 'Gastronomía', 'Actividades',
  'Lujo', 'Upscale', 'Boutique', 'Family friendly', 'Honeymoon', 'Parejas',
  'Aventura', 'Wellness', 'Negocios', 'Beach', 'City', 'Mountains'
];

const HOTEL_CHAINS = [
  'Four Seasons', 'Aman', 'Rosewood', 'Belmond', 'Auberge', 'One&Only',
  'SLH', 'LHW', 'Fairmont', 'Hilton', 'Marriott', 'Hyatt', 'IHG', 'Accor',
  'Mandarin Oriental', 'Peninsula', 'Ritz-Carlton', 'St. Regis', 'Park Hyatt',
  'Conrad', 'Waldorf Astoria', 'Six Senses', 'Banyan Tree', 'Otro'
];

export default function ReviewForm({ open, onClose, review, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    content_type: '',
    country: '',
    city: '',
    provider_type: '',
    hotel_chain: '',
    provider_name: '',
    experience_date: '',
    agent_name: '',
    tags: [],
    fam_type: '',
    fam_details: [],
    summary: '',
    description: '',
    pros: '',
    cons: '',
    tips: '',
    rating: 0,
    recommended: '',
    pdf_files: [],
    images: []
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (review) {
      setFormData({
        title: review.title || '',
        content_type: review.content_type || '',
        country: review.country || '',
        city: review.city || '',
        provider_type: review.provider_type || '',
        hotel_chain: review.hotel_chain || '',
        provider_name: review.provider_name || '',
        experience_date: review.experience_date || '',
        agent_name: review.agent_name || '',
        tags: review.tags || [],
        fam_type: review.fam_type || '',
        fam_details: review.fam_details || [],
        summary: review.summary || '',
        description: review.description || '',
        pros: review.pros || '',
        cons: review.cons || '',
        tips: review.tips || '',
        rating: review.rating || 0,
        recommended: review.recommended || '',
        pdf_files: review.pdf_files || [],
        images: review.images || []
      });
    } else {
      setFormData({
        title: '',
        content_type: '',
        country: '',
        city: '',
        provider_type: '',
        hotel_chain: '',
        provider_name: '',
        experience_date: '',
        agent_name: '',
        tags: [],
        fam_type: '',
        fam_details: [],
        summary: '',
        description: '',
        pros: '',
        cons: '',
        tips: '',
        rating: 0,
        recommended: '',
        pdf_files: [],
        images: []
      });
    }
  }, [review, open]);

  const handleTagToggle = (tag) => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];
    setFormData({ ...formData, tags: newTags });
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);

      if (type === 'pdf') {
        setFormData({ ...formData, pdf_files: [...formData.pdf_files, ...urls] });
      } else {
        setFormData({ ...formData, images: [...formData.images, ...urls] });
      }
      toast.success(`${files.length} archivo(s) subido(s)`);
    } catch (error) {
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (type, index) => {
    if (type === 'pdf') {
      setFormData({ ...formData, pdf_files: formData.pdf_files.filter((_, i) => i !== index) });
    } else {
      setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: '#2E442A' }}>
            {review ? 'Editar Review' : 'Nuevo Review'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="files">Archivos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Título del Review *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-xl"
                  placeholder="Ej: FAM Trip Four Seasons Bali"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Contenido *</Label>
                <Select value={formData.content_type} onValueChange={(v) => setFormData({ ...formData, content_type: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: Indonesia"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad / Región</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: Bali"
                  />
                </div>
              </div>

              {formData.content_type !== 'fam_trip' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cadena Hotelera</Label>
                    <Select value={formData.hotel_chain} onValueChange={(v) => setFormData({ ...formData, hotel_chain: v })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOTEL_CHAINS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre del Proveedor / Hotel</Label>
                    <Input
                      value={formData.provider_name}
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                      className="rounded-xl"
                      placeholder="Ej: Four Seasons Resort Bali at Sayan"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Experiencia</Label>
                  <Input
                    type="date"
                    value={formData.experience_date}
                    onChange={(e) => setFormData({ ...formData, experience_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agente</Label>
                  <Input
                    value={formData.agent_name}
                    onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                    className="rounded-xl"
                    placeholder="Nombre del agente"
                  />
                </div>
              </div>

              {formData.content_type === 'fam_trip' && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de FAM</Label>
                    <Select value={formData.fam_type} onValueChange={(v) => setFormData({ ...formData, fam_type: v })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {FAM_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <FamDetailsInput
                      famDetails={formData.fam_details}
                      onChange={(details) => setFormData({ ...formData, fam_details: details })}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Resumen Corto</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={2}
                  placeholder="Resumen breve del review..."
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción Detallada</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={4}
                  placeholder="Aprendizajes, recomendaciones, detalles..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-700">Pros</Label>
                  <Textarea
                    value={formData.pros}
                    onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                    className="rounded-xl resize-none border-green-200"
                    rows={3}
                    placeholder="Lo bueno..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-700">Contras</Label>
                  <Textarea
                    value={formData.cons}
                    onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                    className="rounded-xl resize-none border-red-200"
                    rows={3}
                    placeholder="Lo malo..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-blue-700">Tips Internos</Label>
                <Textarea
                  value={formData.tips}
                  onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                  className="rounded-xl resize-none border-blue-200"
                  rows={2}
                  placeholder="Tips para otros agentes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rating General</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1"
                      >
                        <Star 
                          className={`w-6 h-6 transition-colors ${
                            star <= formData.rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-stone-300 hover:text-yellow-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>¿Recomendado para clientes?</Label>
                  <Select value={formData.recommended} onValueChange={(v) => setFormData({ ...formData, recommended: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="depende">Depende</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Categorías / Tags</Label>
                <p className="text-xs text-stone-500">Selecciona las categorías que apliquen</p>
                <div className="flex flex-wrap gap-2 p-4 bg-stone-50 rounded-xl">
                  {REVIEW_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        formData.tags.includes(tag) 
                          ? 'bg-[#2E442A] hover:bg-[#3d5a37]' 
                          : 'hover:bg-stone-100'
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags seleccionados ({formData.tags.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        className="bg-[#2E442A]"
                      >
                        {tag}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => handleTagToggle(tag)} 
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              {/* PDFs */}
              <div className="space-y-2">
                <Label>Archivos PDF</Label>
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-4">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'pdf')}
                    className="hidden"
                    id="pdf-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="pdf-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-stone-400" />
                    )}
                    <span className="text-sm text-stone-500 mt-2">
                      Click para subir PDFs
                    </span>
                  </label>
                </div>
                {formData.pdf_files.length > 0 && (
                  <div className="space-y-2">
                    {formData.pdf_files.map((url, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                          PDF {i + 1}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile('pdf', i)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Imágenes</Label>
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-stone-400" />
                    )}
                    <span className="text-sm text-stone-500 mt-2">
                      Click para subir imágenes
                    </span>
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile('image', i)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-stone-100">
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
              {review ? 'Actualizar' : 'Crear Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}