import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { formatDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plane, 
  CreditCard, 
  Shield, 
  File,
  Plus,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TravelDocumentForm from './TravelDocumentForm';
import { motion, AnimatePresence } from 'framer-motion';

const DOC_ICONS = {
  pasaporte: CreditCard,
  visa: FileText,
  boleto_avion: Plane,
  seguro_viaje: Shield,
  otro: File
};

const DOC_LABELS = {
  pasaporte: 'Pasaporte',
  visa: 'Visa',
  boleto_avion: 'Boleto de Avión',
  seguro_viaje: 'Seguro de Viaje',
  otro: 'Otro'
};

export default function TravelDocumentsList({ 
  documents, 
  clientId, 
  tripId, 
  onCreate, 
  onUpdate, 
  onDelete,
  isCreating,
  isUpdating 
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { status: 'expired', label: 'Vencido', color: 'bg-red-100 text-red-700' };
    if (days <= 30) return { status: 'urgent', label: `Vence en ${days} días`, color: 'bg-orange-100 text-orange-700' };
    if (days <= 90) return { status: 'warning', label: `Vence en ${days} días`, color: 'bg-yellow-100 text-yellow-700' };
    return null;
  };

  const handleSave = (data) => {
    if (editingDoc) {
      onUpdate(editingDoc.id, data);
    } else {
      onCreate(data);
    }
    setFormOpen(false);
    setEditingDoc(null);
  };

  const filteredDocs = tripId 
    ? documents.filter(d => d.trip_id === tripId || !d.trip_id)
    : documents;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700">Documentos de Viaje</h3>
        <Button
          size="sm"
          onClick={() => { setEditingDoc(null); setFormOpen(true); }}
          className="rounded-xl text-white text-xs"
          style={{ backgroundColor: '#2E442A' }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Agregar
        </Button>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay documentos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredDocs.map((doc) => {
              const Icon = DOC_ICONS[doc.document_type] || File;
              const expiryStatus = getExpiryStatus(doc.expiry_date);
              
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#2E442A' }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-stone-800">{DOC_LABELS[doc.document_type]}</h4>
                        {expiryStatus && (
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${expiryStatus.color} border-0`}>
                            {expiryStatus.status === 'expired' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {expiryStatus.label}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-stone-600 mb-2">{doc.name}</p>

                      <div className="space-y-1">
                        {doc.document_number && (
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="font-medium">N°:</span>
                            <span>{doc.document_number}</span>
                          </div>
                        )}
                        {doc.country && (
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="font-medium">País:</span>
                            <span>{doc.country}</span>
                          </div>
                        )}
                        {doc.expiry_date && (
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="font-medium">Vencimiento:</span>
                            <span>{formatDate(doc.expiry_date, 'd MMM yyyy', { locale: es })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-blue-600">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-400 hover:text-stone-600"
                        onClick={() => { setEditingDoc(doc); setFormOpen(true); }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-400 hover:text-red-500"
                        onClick={() => setDeleteConfirm(doc)}
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
      )}

      <TravelDocumentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingDoc(null); }}
        document={editingDoc}
        clientId={clientId}
        tripId={tripId}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(deleteConfirm.id); setDeleteConfirm(null); }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}