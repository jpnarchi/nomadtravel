import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Database, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { supabaseAPI } from '@/api/supabaseClient';
import { toast } from 'sonner';
import JSZip from 'jszip';

export default function DescargarDatos() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // List of all entities to export (matching supabaseAPI.entities)
  const entities = [
    { key: 'Client', name: 'Clientes' },
    { key: 'Trip', name: 'Viajes' },
    { key: 'SoldTrip', name: 'Viajes Vendidos' },
    { key: 'TripService', name: 'Servicios de Viajes' },
    { key: 'ClientPayment', name: 'Pagos de Clientes' },
    { key: 'ClientPaymentPlan', name: 'Planes de Pago' },
    { key: 'SupplierPayment', name: 'Pagos a Proveedores' },
    { key: 'GroupMember', name: 'Miembros de Grupos' },
    { key: 'Commission', name: 'Comisiones Internas' },
    { key: 'Attendance', name: 'Asistencia' },
    { key: 'IndustryFair', name: 'Ferias' },
    { key: 'FamTrip', name: 'FAM Trips' },
    { key: 'TripDocumentFile', name: 'Documentos de Viajes' },
    { key: 'TripNote', name: 'Notas de Viajes' },
    { key: 'TripReminder', name: 'Recordatorios' },
    { key: 'TravelDocument', name: 'Documentos de Viaje' },
    { key: 'Task', name: 'Tareas' },
    { key: 'Supplier', name: 'Proveedores' },
    { key: 'SupplierContact', name: 'Contactos de Proveedores' },
    { key: 'SupplierDocument', name: 'Documentos de Proveedores' },
    { key: 'Review', name: 'Reviews' },
    { key: 'LearningMaterial', name: 'Material de Aprendizaje' },
    { key: 'Credential', name: 'Credenciales' },
    { key: 'PersonalCredential', name: 'Credenciales Personales' },
    { key: 'Reminder', name: 'Recordatorios Generales' }
  ];

  // Convert array of objects to CSV
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    // Get all unique keys from all objects
    const allKeys = new Set();
    data.forEach(obj => {
      Object.keys(obj).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);

    // Create header row
    const csvRows = [headers.join(',')];

    // Create data rows
    data.forEach(obj => {
      const values = headers.map(header => {
        const value = obj[header];

        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        }

        if (typeof value === 'object') {
          // Convert objects/arrays to JSON string
          const jsonStr = JSON.stringify(value).replace(/"/g, '""');
          return `"${jsonStr}"`;
        }

        // Escape quotes and values containing commas
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }

        return strValue;
      });

      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadComplete(false);

    try {
      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      // Export each entity
      for (const entity of entities) {
        try {
          const data = await supabaseAPI.entities[entity.key].list();

          if (data && data.length > 0) {
            const csv = convertToCSV(data);
            zip.file(`${entity.key}.csv`, csv);
            successCount++;
          }
        } catch (error) {
          console.error(`Error exporting ${entity.key}:`, error.message);
          errorCount++;
          // Continue with next entity
        }
      }

      // Generate ZIP file
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomad-crm-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setDownloadComplete(true);
      toast.success(`Exportación exitosa: ${successCount} tablas exportadas${errorCount > 0 ? `, ${errorCount} errores` : ''}`);

      setTimeout(() => setDownloadComplete(false), 3000);
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Error al exportar datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2E442A' }}>
          Descargar Datos
        </h1>
        <p className="text-stone-600">
          Exporta toda la información del CRM en formato CSV
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#2E442A15' }}
          >
            <Database className="w-8 h-8" style={{ color: '#2E442A' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Exportación Completa</h2>
            <p className="text-sm text-stone-500">Descarga todos los datos en un archivo ZIP</p>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-5 h-5 text-stone-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-stone-800 mb-2">¿Qué se incluye?</h3>
              <p className="text-sm text-stone-600 mb-3">
                El archivo ZIP contendrá un archivo CSV por cada tipo de dato:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-8">
            {entities.map((entity, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2E442A' }} />
                {entity.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Información importante</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• La exportación puede tardar unos segundos dependiendo de la cantidad de datos</li>
                <li>• Los archivos CSV pueden abrirse en Excel, Google Sheets o cualquier editor de hojas de cálculo</li>
                <li>• Esta función está disponible solo para administradores</li>
                <li>• Los datos se exportan directamente desde tu navegador de forma segura</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-white px-8 py-6 text-lg"
            style={{ backgroundColor: '#2E442A' }}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Generando exportación...
              </>
            ) : downloadComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-3" />
                ¡Descarga completa!
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-3" />
                Descargar Todos los Datos
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
