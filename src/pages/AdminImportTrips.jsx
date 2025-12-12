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
  const [fileUrl, setFileUrl] = useState('');
  const [importedTripId, setImportedTripId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const agents = users.filter(u => u.role === 'user' || u.custom_role === 'agente' || u.custom_role === 'supervisor');

  const importMutation = useMutation({
    mutationFn: async ({ file_url, agent_email }) => {
      const response = await base44.functions.invoke('importTripFromInvoice', { 
        file_url, 
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
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(result.file_url);
      toast.success('Archivo subido');
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = () => {
    if (!fileUrl) {
      toast.error('Primero sube un archivo');
      return;
    }
    if (!selectedAgent) {
      toast.error('Selecciona un agente');
      return;
    }
    importMutation.mutate({ file_url: fileUrl, agent_email: selectedAgent });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Smart Import de Viajes</h1>
        <p className="text-stone-500 text-sm">Importa viajes desde invoices en PDF usando IA</p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-800 mb-2">1. Sube el Invoice (PDF)</h3>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading || importMutation.isPending}
                className="flex-1 text-sm"
              />
              {uploading && <Loader2 className="w-5 h-5 animate-spin text-stone-400" />}
              {fileUrl && !uploading && <CheckCircle className="w-5 h-5 text-green-600" />}
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Ver archivo subido
              </a>
            )}
          </div>

          {fileUrl && !importedTripId && (
            <div className="space-y-4">
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

              <div>
                <h3 className="font-semibold text-stone-800 mb-2">3. Extraer Datos del Invoice</h3>
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
                        setFileUrl('');
                        setSelectedAgent('');
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
          <li>Sube el invoice en formato PDF</li>
          <li>La IA extraerá automáticamente: cliente, destino, fechas, servicios, precios y pagos</li>
          <li>Se creará el viaje vendido con todos los servicios y pagos</li>
          <li>Asigna el viaje a un agente para que aparezca en su dashboard</li>
          <li>El agente podrá ver y editar el viaje importado</li>
        </ul>
      </Card>
    </div>
  );
}