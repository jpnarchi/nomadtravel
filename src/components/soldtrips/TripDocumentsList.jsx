import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, Trash2, Loader2, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DOC_TYPES = {
  voucher_vuelo: { label: 'Voucher de Vuelo', color: 'bg-purple-100 text-purple-700' },
  reserva_hotel: { label: 'Reserva de Hotel', color: 'bg-blue-100 text-blue-700' },
  confirmacion_tour: { label: 'Confirmación de Tour', color: 'bg-emerald-100 text-emerald-700' },
  seguro_viaje: { label: 'Seguro de Viaje', color: 'bg-red-100 text-red-700' },
  comprobante_pago: { label: 'Comprobante de Pago', color: 'bg-green-100 text-green-700' },
  itinerario: { label: 'Itinerario', color: 'bg-amber-100 text-amber-700' },
  otro: { label: 'Otro', color: 'bg-stone-100 text-stone-700' }
};

export default function TripDocumentsList({ documents = [], soldTripId, onCreate, onDelete, isLoading }) {
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ document_type: 'voucher_vuelo', name: '', notes: '' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecciona un archivo');
      return;
    }

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await onCreate({
        sold_trip_id: soldTripId,
        document_type: formData.document_type,
        name: formData.name,
        file_url: file_url,
        notes: formData.notes
      });

      setFormOpen(false);
      setFormData({ document_type: 'voucher_vuelo', name: '', notes: '' });
      setFile(null);
      toast.success('Documento subido');
    } catch (error) {
      toast.error('Error al subir archivo');
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setFormOpen(true)}
          className="rounded-xl text-white"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {documents.map((doc) => {
            const docTypeInfo = DOC_TYPES[doc.document_type] || DOC_TYPES.otro;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border border-stone-200 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${docTypeInfo.color}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{doc.name}</p>
                    <p className={`text-xs font-medium mt-1 ${docTypeInfo.color} inline-block px-2 py-0.5 rounded`}>
                      {docTypeInfo.label}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {format(new Date(doc.created_date), 'd MMM yyyy', { locale: es })}
                    </p>
                    {doc.notes && (
                      <p className="text-xs text-stone-500 mt-1 italic">"{doc.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 text-stone-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-stone-400 hover:text-red-500"
                      onClick={() => onDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay documentos. Sube el primer documento.</p>
        </div>
      )}

      {/* Upload Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#2E442A' }}>Subir Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre del Documento</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Voucher Vuelo MX-NY"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                className="rounded-xl"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploadingFile || !file}
                className="rounded-xl text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                {uploadingFile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Subir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}