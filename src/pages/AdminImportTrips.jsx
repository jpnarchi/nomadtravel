import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminImportTrips() {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast.error('Por favor selecciona un archivo CSV válido');
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const trips = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const trip = {};
      headers.forEach((header, index) => {
        trip[header] = values[index] || '';
      });
      trips.push(trip);
    }

    return trips;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const trips = parseCSV(text);

        if (trips.length === 0) {
          toast.error('El archivo no contiene datos válidos');
          setImporting(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const trip of trips) {
          try {
            await supabaseAPI.entities.Trip.create({
              client_name: trip.client_name || trip['Cliente'],
              destination: trip.destination || trip['Destino'],
              start_date: trip.start_date || trip['Fecha Inicio'],
              end_date: trip.end_date || trip['Fecha Fin'],
              budget: parseFloat(trip.budget || trip['Presupuesto']) || 0,
              stage: trip.stage || trip['Etapa'] || 'nuevo',
              created_by: user?.primaryEmailAddress?.emailAddress,
              created_date: new Date().toISOString(),
              is_deleted: false
            });
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push({
              client: trip.client_name || trip['Cliente'],
              error: error.message
            });
          }
        }

        setResults({
          total: trips.length,
          success: successCount,
          errors: errorCount,
          errorDetails: errors
        });

        if (successCount > 0) {
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          toast.success(`${successCount} viajes importados correctamente`);
        }

        if (errorCount > 0) {
          toast.error(`${errorCount} viajes no pudieron ser importados`);
        }

      } catch (error) {
        console.error('Error al importar:', error);
        toast.error('Error al procesar el archivo');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Importar Viajes Masivamente</h1>
        <p className="text-stone-500 text-sm mt-1">
          Sube un archivo CSV para importar múltiples viajes a la vez
        </p>
      </div>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Formato del archivo CSV</h3>
            <p className="text-sm text-blue-800 mb-2">
              El archivo debe contener las siguientes columnas (en cualquier orden):
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>client_name</strong> o <strong>Cliente</strong>: Nombre del cliente</li>
              <li><strong>destination</strong> o <strong>Destino</strong>: Destino del viaje</li>
              <li><strong>start_date</strong> o <strong>Fecha Inicio</strong>: Fecha de inicio (YYYY-MM-DD)</li>
              <li><strong>end_date</strong> o <strong>Fecha Fin</strong>: Fecha de fin (YYYY-MM-DD)</li>
              <li><strong>budget</strong> o <strong>Presupuesto</strong>: Presupuesto estimado (número)</li>
              <li><strong>stage</strong> o <strong>Etapa</strong>: Etapa (nuevo, cotizando, etc.)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Upload Section */}
      <Card className="p-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-12 hover:border-stone-400 transition-colors">
            <FileText className="w-12 h-12 text-stone-400 mb-4" />
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-stone-700 hover:text-stone-900">
                Selecciona un archivo CSV
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <p className="mt-3 text-sm text-stone-600">
                Archivo seleccionado: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Viajes
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card className="p-6">
          <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Resultados de la Importación
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-xs text-stone-500">Total</p>
                <p className="text-2xl font-bold text-stone-800">{results.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600">Exitosos</p>
                <p className="text-2xl font-bold text-green-700">{results.success}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600">Errores</p>
                <p className="text-2xl font-bold text-red-700">{results.errors}</p>
              </div>
            </div>

            {results.errorDetails.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Detalles de errores:</h4>
                <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {results.errorDetails.map((error, index) => (
                    <div key={index} className="text-xs text-red-700 mb-1">
                      <strong>{error.client}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
