import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Clock, FileText, CreditCard, Shield, Plane } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DOC_ICONS = {
  pasaporte: CreditCard,
  visa: FileText,
  boleto_avion: Plane,
  seguro_viaje: Shield,
  otro: FileText
};

const DOC_LABELS = {
  pasaporte: 'Pasaporte',
  visa: 'Visa',
  boleto_avion: 'Boleto',
  seguro_viaje: 'Seguro',
  otro: 'Otro'
};

export default function ExpiringDocuments({ documents, clients }) {
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Cliente';
  };

  const expiringDocs = documents
    .filter(doc => doc.expiry_date)
    .map(doc => {
      const days = differenceInDays(new Date(doc.expiry_date), new Date());
      return { ...doc, daysUntilExpiry: days };
    })
    .filter(doc => doc.daysUntilExpiry <= 90)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  if (expiringDocs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <div className="p-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Documentos por Vencer</h3>
        </div>
        <div className="p-8 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          <p className="text-sm text-stone-400">Sin documentos próximos a vencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
      <div className="p-4 border-b border-stone-100">
        <h3 className="text-sm font-semibold text-stone-800">Documentos por Vencer</h3>
      </div>
      
      <div className="p-3 max-h-64 overflow-y-auto space-y-2">
        {expiringDocs.map((doc) => {
          const Icon = DOC_ICONS[doc.document_type] || FileText;
          const isExpired = doc.daysUntilExpiry < 0;
          const isUrgent = doc.daysUntilExpiry <= 30;

          return (
            <Link 
              key={doc.id} 
              to={createPageUrl(`ClientDetail?id=${doc.client_id}`)}
              className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg transition-colors"
            >
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isExpired ? 'bg-red-100' : isUrgent ? 'bg-orange-100' : 'bg-yellow-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${
                  isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-yellow-600'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-800 truncate">
                  {DOC_LABELS[doc.document_type]} - {getClientName(doc.client_id)}
                </p>
                <p className="text-xs text-stone-500 truncate">{doc.name}</p>
              </div>

              <Badge className={`text-xs whitespace-nowrap ${
                isExpired ? 'bg-red-100 text-red-700' : 
                isUrgent ? 'bg-orange-100 text-orange-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isExpired ? (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Vencido
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    {doc.daysUntilExpiry}d
                  </>
                )}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}