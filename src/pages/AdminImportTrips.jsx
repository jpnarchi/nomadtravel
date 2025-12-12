import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AdminImportTrips() {
  const [uploading, setUploading] = useState(false);
  const [fileUrls, setFileUrls] = useState([]);
  const [importedTripId, setImportedTripId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      // If not admin, auto-select their own email
      if (user.role !== 'admin') {
        setSelectedAgent(user.email);
      }
    };
    fetchUser();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const agents = users.filter(u => u.role === 'user' || u.custom_role === 'agente' || u.custom_role === 'supervisor');
  const isAdmin = currentUser?.role === 'admin';

  const importMutation = useMutation({
    mutationFn: async ({ file_urls, agent_email }) => {
      const response = await base44.functions.invoke('importTripFromInvoice', { 
        file_urls, 
        agent_email 
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Viaje importado exitosamente');
      setImportedTripId(data.sold_trip_id);
      queryClient.invalidateQueries({ queryKey: ['soldTrips'] });
    },
    onError: (error) => {
      toast.error('Error al importar viaje: ' + (error.message || 'Error desconocido'));
    }
  });

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

  const handleImport = () => {
    if (fileUrls.length === 0) {
      toast.error('Primero sube al menos un archivo');
      return;
    }
    if (!selectedAgent) {
      toast.error('Selecciona un agente');
      return;
    }
    importMutation.mutate({ file_urls: fileUrls, agent_email: selectedAgent });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Smart Import de Viajes</h1>
        <p className="text-stone-500 text-sm">
          Importa viajes desde invoices en PDF usando IA
          {!isAdmin && currentUser && (
            <span className="block mt-1 text-xs" style={{ color: '#2E442A' }}>
              Los viajes se asignarán automáticamente a tu cuenta
            </span>
          )}
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-800 mb-2">1. Sube Archivos (PDF, Imágenes)</h3>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf,image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading || importMutation.isPending}
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

          {fileUrls.length > 0 && !importedTripId && (
            <div className="space-y-4">
              {isAdmin && (
                <div>
                  <h3 className="font-semibold text-stone-800 mb-2">2. Asignar a Agente</h3>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecciona un agente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.email}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-stone-800 mb-2">{isAdmin ? '3' : '2'}. Extraer Datos del Invoice</h3>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="text-white"
                  style={{ backgroundColor: '#2E442A' }}
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extrayendo datos con IA...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Viaje
                    </>
                  )}
                </Button>
                <p className="text-xs text-stone-500 mt-2">
                  La IA leerá el invoice y extraerá automáticamente: cliente, destino, fechas, servicios, pagos, etc.
                </p>
              </div>
            </div>
          )}

          {importedTripId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">¡Viaje Importado!</h3>
                  <p className="text-sm text-green-700 mb-3">
                    El viaje ha sido creado exitosamente y asignado al agente seleccionado.
                  </p>

                  <div className="flex gap-2">
                    <Link to={createPageUrl('SoldTripDetail') + '?id=' + importedTripId}>
                      <Button
                        className="text-white"
                        style={{ backgroundColor: '#2E442A' }}
                      >
                        Ver Viaje
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportedTripId(null);
                        setFileUrls([]);
                        if (isAdmin) setSelectedAgent('');
                      }}
                    >
                      Importar Otro
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Cómo Funciona
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Sube uno o más archivos: invoices (PDF) o imágenes de servicios</li>
          <li>La IA extraerá automáticamente: cliente, destino, fechas, servicios, precios y pagos</li>
          <li>Se creará el viaje vendido con todos los servicios y pagos</li>
          {isAdmin ? (
            <>
              <li>Asigna el viaje a un agente para que aparezca en su dashboard</li>
              <li>El agente podrá ver y editar el viaje importado</li>
            </>
          ) : (
            <li>El viaje se asignará automáticamente a tu cuenta</li>
          )}
        </ul>
      </Card>
    </div>
  );
}