import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Building2, Calendar, User, FileText, CheckCircle, XCircle, HelpCircle, Hotel, Plane } from 'lucide-react';
import { Card } from "@/components/ui/card";

const CONTENT_TYPE_LABELS = {
  fam_trip: 'FAM Trip',
  proveedor: 'Proveedor',
  hotel: 'Hotel',
  destino: 'Destino',
  aerolinea: 'Aerolínea',
  crucero: 'Crucero',
  experiencia: 'Experiencia',
  otro: 'Otro'
};

const FAM_TYPE_LABELS = {
  hotelero: 'Hotelero',
  dmc: 'DMC',
  aerolinea: 'Aerolínea',
  destino: 'Destino',
  crucero: 'Crucero',
  mixto: 'Mixto'
};

export default function ReviewDetail({ review, open, onClose }) {
  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Badge 
              className="text-xs"
              style={{ backgroundColor: '#2E442A' }}
            >
              {CONTENT_TYPE_LABELS[review.content_type] || review.content_type}
            </Badge>
            {review.fam_type && (
              <Badge variant="outline" className="text-xs">
                FAM: {FAM_TYPE_LABELS[review.fam_type]}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-stone-800 mt-2">
            {review.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl">
            {review.provider_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-stone-400" />
                <span className="text-stone-700">{review.provider_name}</span>
              </div>
            )}
            {(review.city || review.country) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span className="text-stone-700">
                  {[review.city, review.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {review.experience_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span className="text-stone-700">
                  {format(new Date(review.experience_date), 'd MMMM yyyy', { locale: es })}
                </span>
              </div>
            )}
            {review.agent_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-stone-400" />
                <span className="text-stone-700">{review.agent_name}</span>
              </div>
            )}
            {review.hotel_chain && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-stone-400" />
                <span className="text-stone-700">{review.hotel_chain}</span>
              </div>
            )}
          </div>

          {/* Rating & Recommendation */}
          <div className="flex items-center justify-between">
            {review.rating > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-500">Rating:</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'}`} 
                    />
                  ))}
                </div>
              </div>
            )}
            {review.recommended && (
              <Badge 
                className={`text-sm ${
                  review.recommended === 'si' ? 'bg-green-100 text-green-700' :
                  review.recommended === 'no' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}
              >
                {review.recommended === 'si' && <CheckCircle className="w-4 h-4 mr-1" />}
                {review.recommended === 'no' && <XCircle className="w-4 h-4 mr-1" />}
                {review.recommended === 'depende' && <HelpCircle className="w-4 h-4 mr-1" />}
                {review.recommended === 'si' ? 'Recomendado' : 
                 review.recommended === 'no' ? 'No recomendado' : 
                 'Depende'}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {review.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag, i) => (
                <Badge key={i} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          {/* FAM Details */}
          {review.fam_details?.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-800 mb-3">Servicios del FAM</h4>
              <div className="space-y-3">
                {review.fam_details.map((item, index) => {
                  const getIcon = () => {
                    switch (item.type) {
                      case 'hotel': return <Hotel className="w-4 h-4" />;
                      case 'aerolinea': return <Plane className="w-4 h-4" />;
                      default: return <MapPin className="w-4 h-4" />;
                    }
                  };

                  return (
                    <Card key={index} className="p-4 bg-stone-50 border-stone-200">
                      <div className="flex items-start gap-3">
                        <div className="mt-1" style={{ color: '#2E442A' }}>
                          {getIcon()}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-stone-800">{item.name}</h5>
                            <Badge variant="outline" className="text-xs">
                              {item.type === 'hotel' ? 'Hotel' : 
                               item.type === 'aerolinea' ? 'Aerolínea' : 
                               item.type === 'experiencia' ? 'Experiencia' : 
                               item.type === 'destino' ? 'Destino' : 'Otro'}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-xs text-stone-600">
                            {item.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.city}
                              </div>
                            )}
                            {item.chain && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {item.chain}
                              </div>
                            )}
                          </div>

                          {item.rating > 0 && (
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'}`} 
                                />
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-sm text-stone-600 mt-2">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {review.summary && (
            <div>
              <h4 className="font-semibold text-stone-800 mb-2">Resumen</h4>
              <p className="text-stone-600">{review.summary}</p>
            </div>
          )}

          {/* Description */}
          {review.description && (
            <div>
              <h4 className="font-semibold text-stone-800 mb-2">Descripción Detallada</h4>
              <p className="text-stone-600 whitespace-pre-wrap">{review.description}</p>
            </div>
          )}

          {/* Pros & Cons */}
          {(review.pros || review.cons) && (
            <div className="grid grid-cols-2 gap-4">
              {review.pros && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-green-700 mb-2">✓ Pros</h4>
                  <p className="text-sm text-green-800 whitespace-pre-wrap">{review.pros}</p>
                </div>
              )}
              {review.cons && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-red-700 mb-2">✗ Contras</h4>
                  <p className="text-sm text-red-800 whitespace-pre-wrap">{review.cons}</p>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {review.tips && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-700 mb-2">💡 Tips Internos</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{review.tips}</p>
            </div>
          )}

          {/* Destination Tips */}
          {review.destination_tips && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h4 className="font-semibold text-purple-700 mb-2">🗺️ Tips de la Ciudad</h4>
              <p className="text-sm text-purple-800 whitespace-pre-wrap">{review.destination_tips}</p>
            </div>
          )}

          {/* PDFs */}
          {review.pdf_files?.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-800 mb-2">Archivos PDF</h4>
              <div className="space-y-2">
                {review.pdf_files.map((url, i) => (
                  <a 
                    key={i}
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-stone-700">Documento PDF {i + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {review.images?.length > 0 && (
            <div>
              <h4 className="font-semibold text-stone-800 mb-2">Imágenes</h4>
              <div className="grid grid-cols-3 gap-2">
                {review.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={url} 
                      alt="" 
                      className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity" 
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}