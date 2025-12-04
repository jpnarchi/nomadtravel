import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, Image, Link as LinkIcon, Eye, Edit2, Trash2,
  BookOpen, Video, FileCode, StickyNote, FolderOpen
} from 'lucide-react';

const CATEGORY_CONFIG = {
  guia: { label: 'Guía', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  manual: { label: 'Manual', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  presentacion: { label: 'Presentación', icon: FileCode, color: 'bg-orange-100 text-orange-700' },
  video: { label: 'Video', icon: Video, color: 'bg-red-100 text-red-700' },
  link: { label: 'Link', icon: LinkIcon, color: 'bg-cyan-100 text-cyan-700' },
  pdf: { label: 'PDF', icon: FileText, color: 'bg-rose-100 text-rose-700' },
  notas: { label: 'Notas', icon: StickyNote, color: 'bg-yellow-100 text-yellow-700' },
  otro: { label: 'Otro', icon: FolderOpen, color: 'bg-stone-100 text-stone-700' }
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

export default function LearningCard({ material, onView, onEdit, onDelete }) {
  const config = CATEGORY_CONFIG[material.category] || CATEGORY_CONFIG.otro;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
            <Icon className="w-5 h-5" style={{ color: '#2E442A' }} />
          </div>
          <div className="flex-1">
            <Badge className={`${config.color} text-xs mb-1`}>{config.label}</Badge>
            <h3 className="font-semibold text-stone-800 line-clamp-2">{material.title}</h3>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(material)}>
            <Eye className="w-4 h-4 text-stone-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(material)}>
            <Edit2 className="w-4 h-4 text-stone-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(material)}>
            <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
          </Button>
        </div>
      </div>

      {material.destination && (
        <p className="text-sm text-stone-500 mb-2">📍 {material.destination}</p>
      )}

      {material.provider_type && material.provider_type !== 'general' && (
        <p className="text-sm text-stone-500 mb-2">🏢 {PROVIDER_LABELS[material.provider_type]}</p>
      )}

      {material.description && (
        <p className="text-sm text-stone-500 line-clamp-2 mb-3">{material.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-stone-400">
        {material.pdf_files?.length > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" /> {material.pdf_files.length} PDF
          </span>
        )}
        {material.images?.length > 0 && (
          <span className="flex items-center gap-1">
            <Image className="w-3 h-3" /> {material.images.length} img
          </span>
        )}
        {material.external_link && (
          <span className="flex items-center gap-1">
            <LinkIcon className="w-3 h-3" /> Link
          </span>
        )}
      </div>

      {material.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-stone-100">
          {material.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {material.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{material.tags.length - 3}</Badge>
          )}
        </div>
      )}
    </div>
  );
}