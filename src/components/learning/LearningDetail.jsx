import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, ExternalLink, Download } from 'lucide-react';

const CATEGORY_LABELS = {
  guia: 'Guía',
  manual: 'Manual',
  presentacion: 'Presentación',
  video: 'Video',
  link: 'Link',
  pdf: 'PDF',
  notas: 'Notas',
  otro: 'Otro'
};

const PROVIDER_LABELS = {
  general: 'General',
  dmc: 'DMC',
  hotel: 'Hotel',
  aerolinea: 'Aerolínea',
  transporte: 'Transporte',
  cruise: 'Crucero',
  experiencia: 'Experiencia',
  otro: 'Otro'
};

export default function LearningDetail({ material, open, onClose }) {
  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge style={{ backgroundColor: '#2E442A', color: 'white' }}>
              {CATEGORY_LABELS[material.category] || material.category}
            </Badge>
            {material.provider_type && material.provider_type !== 'general' && (
              <Badge variant="outline">{PROVIDER_LABELS[material.provider_type]}</Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-stone-800">
            {material.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {material.destination && (
            <div>
              <p className="text-sm text-stone-500">Destino</p>
              <p className="font-medium text-stone-800">{material.destination}</p>
            </div>
          )}

          {material.description && (
            <div>
              <p className="text-sm text-stone-500 mb-1">Descripción</p>
              <p className="text-stone-700 whitespace-pre-wrap">{material.description}</p>
            </div>
          )}

          {material.external_link && (
            <div>
              <p className="text-sm text-stone-500 mb-1">Link externo</p>
              <a 
                href={material.external_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
                style={{ color: '#2E442A' }}
              >
                <ExternalLink className="w-4 h-4" />
                {material.external_link}
              </a>
            </div>
          )}

          {material.pdf_files?.length > 0 && (
            <div>
              <p className="text-sm text-stone-500 mb-2">Archivos PDF</p>
              <div className="space-y-2">
                {material.pdf_files.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" style={{ color: '#2E442A' }} />
                    <span className="text-sm flex-1">PDF {i + 1}</span>
                    <Download className="w-4 h-4 text-stone-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {material.images?.length > 0 && (
            <div>
              <p className="text-sm text-stone-500 mb-2">Imágenes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {material.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {material.tags?.length > 0 && (
            <div>
              <p className="text-sm text-stone-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {material.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}