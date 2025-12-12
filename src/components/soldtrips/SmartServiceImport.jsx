import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, FileText, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function SmartServiceImport({ open, onClose, soldTripId }) {
  const [uploading, setUploading] = useState(false);
  const [fileUrls, setFileUrls] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
      }
      setFileUrls(prev => [...prev, ...uploadedUrls]);
      toast.success(`${files.length} archivo(s) subido(s)`);
    } catch (error) {
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (fileUrls.length === 0) {
      toast.error('Sube al menos un archivo');
      return;
    }

    setImporting(true);
    try {
      const response = await base44.functions.invoke('importServiceFromFiles', {
        file_urls: fileUrls,
        sold_trip_id: soldTripId
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onClose();
        window.location.reload();
      } else {
        toast.error(response.data.error || 'Error al importar');
      }
    } catch (error) {
      toast.error('Error al importar servicios');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFileUrls([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: '#2E442A' }}>
            <Sparkles className="w-5 h-5" />
            Smart Import de Servicios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Import Inteligente con IA</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Sube facturas, confirmaciones, vouchers o fotos de servicios (PDFs o imágenes) y la IA extraerá automáticamente todos los servicios incluidos: hoteles, vuelos, traslados, tours, cruceros, trenes, DMCs, etc.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label>Subir Archivos de Servicios (PDFs o Imágenes)</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="file"
                accept="application/pdf,image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading || importing}
                className="flex-1 text-sm"
              />
              {uploading && <Loader2 className="w-5 h-5 animate-spin text-stone-400" />}
              {fileUrls.length > 0 && !uploading && <CheckCircle className="w-5 h-5 text-green-600" />}
            </div>
            {fileUrls.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-stone-600">{fileUrls.length} archivo(s) subido(s):</p>
                {fileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    Archivo {index + 1}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={fileUrls.length === 0 || importing}
              className="rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Sparkles className="w-4 h-4 mr-2" />
              Importar Servicios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}