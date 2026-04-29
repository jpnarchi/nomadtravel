import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Database, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import JSZip from 'jszip';

// Map of every CRM entity to its underlying Supabase table.
// Kept aligned with `supabaseAPI.entities` in src/api/supabaseClient.js.
// Order matters only for display; export runs them all.
const TABLES = [
  { key: 'Client', table: 'clients', label: 'Clientes' },
  { key: 'Trip', table: 'trips', label: 'Viajes' },
  { key: 'SoldTrip', table: 'sold_trips', label: 'Viajes Vendidos' },
  { key: 'TripService', table: 'trip_services', label: 'Servicios de Viajes' },
  { key: 'ClientPayment', table: 'client_payments', label: 'Pagos de Clientes' },
  { key: 'ClientPaymentPlan', table: 'client_payment_plan', label: 'Planes de Pago' },
  { key: 'SupplierPayment', table: 'supplier_payments', label: 'Pagos a Proveedores' },
  { key: 'Commission', table: 'commissions', label: 'Comisiones Internas' },
  { key: 'GroupMember', table: 'group_members', label: 'Miembros de Grupos' },
  { key: 'Supplier', table: 'suppliers', label: 'Proveedores' },
  { key: 'SupplierContact', table: 'supplier_contacts', label: 'Contactos de Proveedores' },
  { key: 'SupplierDocument', table: 'supplier_documents', label: 'Documentos de Proveedores' },
  { key: 'TripDocumentFile', table: 'trip_document_files', label: 'Archivos de Viajes' },
  { key: 'TripNote', table: 'trip_notes', label: 'Notas de Viajes' },
  { key: 'TripReminder', table: 'trip_reminders', label: 'Recordatorios de Viajes' },
  { key: 'TravelDocument', table: 'travel_documents', label: 'Documentos de Viaje' },
  { key: 'Reminder', table: 'reminders', label: 'Recordatorios Generales' },
  { key: 'Task', table: 'tasks', label: 'Tareas' },
  { key: 'Credential', table: 'credentials', label: 'Credenciales' },
  { key: 'PersonalCredential', table: 'personal_credentials', label: 'Credenciales Personales' },
  { key: 'Review', table: 'reviews', label: 'Reviews' },
  { key: 'LearningMaterial', table: 'learning_materials', label: 'Material de Aprendizaje' },
  { key: 'Attendance', table: 'attendance', label: 'Asistencia' },
  { key: 'FamTrip', table: 'fam_trips', label: 'FAM Trips' },
  { key: 'IndustryFair', table: 'industry_fairs', label: 'Ferias' },
  { key: 'ErrorReport', table: 'error_reports', label: 'Reportes de Errores' },
  { key: 'SharedTripForm', table: 'shared_trip_forms', label: 'Formularios Compartidos' },
  { key: 'ServiceDropdownOption', table: 'service_dropdown_options', label: 'Opciones de Servicios' },
  { key: 'User', table: 'users', label: 'Usuarios' },
];

const SALES_REPORT_COLUMNS = [
  'sold_trip_id', 'created_date', 'sale_date', 'status',
  'client_id', 'client_name', 'client_email',
  'agent_email', 'destination', 'departure_date', 'return_date',
  'total_amount', 'currency', 'paid_amount', 'pending_amount',
  'commission_amount', 'is_deleted',
];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach(k => set.add(k));
      return set;
    }, new Set())
  );
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

async function fetchAllRows(tableName) {
  // Direct supabase.from() — bypasses the is_deleted filter that supabaseAPI.list() applies,
  // so admins get a complete export including soft-deleted rows.
  const PAGE = 1000;
  let from = 0;
  const all = [];
  // Loop until we get a short page back.
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function buildSalesReport(soldTrips, clients) {
  const clientById = new Map((clients || []).map(c => [c.id, c]));
  return (soldTrips || []).map(st => {
    const c = clientById.get(st.client_id) || {};
    return {
      sold_trip_id: st.id,
      created_date: st.created_date,
      sale_date: st.sale_date ?? st.sold_date ?? null,
      status: st.status,
      client_id: st.client_id,
      client_name: c.full_name ?? c.name ?? null,
      client_email: c.email ?? null,
      agent_email: st.agent_email ?? st.created_by ?? null,
      destination: st.destination,
      departure_date: st.departure_date ?? st.start_date ?? null,
      return_date: st.return_date ?? st.end_date ?? null,
      total_amount: st.total_amount ?? st.total_price ?? null,
      currency: st.currency ?? null,
      paid_amount: st.paid_amount ?? null,
      pending_amount: st.pending_amount ?? null,
      commission_amount: st.commission_amount ?? null,
      is_deleted: st.is_deleted ?? false,
    };
  });
}

function salesReportCSV(rows) {
  const lines = [SALES_REPORT_COLUMNS.join(',')];
  for (const r of rows) {
    lines.push(SALES_REPORT_COLUMNS.map(c => csvEscape(r[c])).join(','));
  }
  return lines.join('\n');
}

export default function AdminExport() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: TABLES.length, label: '' });
  const [errors, setErrors] = useState([]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadComplete(false);
    setErrors([]);

    const zip = new JSZip();
    const folder = zip.folder('tablas');
    const summary = {
      exported_at: new Date().toISOString(),
      generator: 'Nomad Travel CRM — AdminExport',
      tables: {},
      errors: [],
    };
    const localErrors = [];
    let soldTripsRows = null;
    let clientsRows = null;

    try {
      for (let i = 0; i < TABLES.length; i++) {
        const t = TABLES[i];
        setProgress({ current: i + 1, total: TABLES.length, label: t.label });
        try {
          const rows = await fetchAllRows(t.table);
          const csv = rowsToCSV(rows);
          // Always write the file, even if empty, so consumers see the table existed.
          folder.file(`${t.key}.csv`, csv || '');
          summary.tables[t.key] = {
            table: t.table,
            row_count: rows.length,
            soft_deleted_count: rows.filter(r => r.is_deleted === true).length,
          };
          if (t.key === 'SoldTrip') soldTripsRows = rows;
          if (t.key === 'Client') clientsRows = rows;
        } catch (err) {
          const msg = err?.message || String(err);
          console.error(`Error exporting ${t.table}:`, err);
          localErrors.push({ table: t.table, key: t.key, error: msg });
          summary.errors.push({ table: t.table, key: t.key, error: msg });
        }
      }

      // Sales report — joins SoldTrip + Client into one flattened CSV.
      if (soldTripsRows) {
        try {
          const report = buildSalesReport(soldTripsRows, clientsRows || []);
          zip.file('reporte-ventas.csv', salesReportCSV(report));
          summary.sales_report = {
            row_count: report.length,
            columns: SALES_REPORT_COLUMNS,
          };
        } catch (err) {
          console.error('Error building sales report:', err);
          localErrors.push({ table: '_sales_report', key: 'SalesReport', error: err?.message || String(err) });
        }
      }

      zip.file('manifest.json', JSON.stringify(summary, null, 2));
      zip.file(
        'README.txt',
        [
          'Nomad Travel CRM — Exportación completa',
          `Generado: ${summary.exported_at}`,
          '',
          'Contenido:',
          '  tablas/*.csv          — Una fila por registro de cada tabla de Supabase.',
          '                           Incluye registros con is_deleted = true.',
          '  reporte-ventas.csv    — Ventas (sold_trips) enriquecidas con datos del cliente.',
          '  manifest.json         — Conteos por tabla y errores de exportación.',
          '',
          'Notas:',
          '  - Los archivos de almacenamiento (PDFs, imágenes) NO se incluyen,',
          '    solo sus URLs en las tablas correspondientes.',
          '  - Campos JSON se serializan como cadenas dentro del CSV.',
        ].join('\n')
      );

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomad-crm-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setErrors(localErrors);
      setDownloadComplete(true);
      const ok = TABLES.length - localErrors.length;
      if (localErrors.length === 0) {
        toast.success(`Exportación completa: ${ok} tablas`);
      } else {
        toast.warning(`Exportación con ${localErrors.length} errores: ${ok}/${TABLES.length} tablas OK`);
      }
      setTimeout(() => setDownloadComplete(false), 3000);
    } catch (err) {
      console.error('Fatal export error:', err);
      toast.error('Error al exportar: ' + (err?.message || 'desconocido'));
    } finally {
      setIsDownloading(false);
      setProgress({ current: 0, total: TABLES.length, label: '' });
    }
  };

  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2E442A' }}>
          Exportación Administrativa
        </h1>
        <p className="text-stone-600">
          Descarga un ZIP con todas las tablas del CRM (clientes, viajes, ventas, pagos, comisiones, proveedores, credenciales, etc.) más un reporte de ventas.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#2E442A15' }}>
            <Database className="w-8 h-8" style={{ color: '#2E442A' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Backup completo en CSV</h2>
            <p className="text-sm text-stone-500">Un archivo CSV por tabla + reporte de ventas + manifest.json</p>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-5 h-5 text-stone-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-stone-800 mb-1">Tablas incluidas ({TABLES.length})</h3>
              <p className="text-sm text-stone-600">Se exportan TODOS los registros, incluidos los marcados como eliminados.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-8">
            {TABLES.map((t) => (
              <div key={t.key} className="flex items-center gap-2 text-sm text-stone-600">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2E442A' }} />
                <span className="truncate" title={t.table}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Información importante</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• La exportación corre en tu navegador y puede tardar varios segundos.</li>
                <li>• El ZIP NO incluye archivos binarios (PDFs/imágenes), solo sus URLs.</li>
                <li>• Solo administradores pueden acceder a esta página.</li>
                <li>• Si una tabla falla, las demás continúan; los errores quedan en <code>manifest.json</code>.</li>
              </ul>
            </div>
          </div>
        </div>

        {isDownloading && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-stone-600 mb-2">
              <span>Exportando: {progress.label}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${pct}%`, backgroundColor: '#2E442A' }}
              />
            </div>
          </div>
        )}

        {!isDownloading && errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-red-900 mb-2">Tablas con errores ({errors.length})</h4>
            <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
              {errors.map((e, i) => (
                <li key={i}><code>{e.table}</code>: {e.error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-white px-8 py-6 text-lg"
            style={{ backgroundColor: '#2E442A' }}
          >
            {isDownloading ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Generando exportación...</>
            ) : downloadComplete ? (
              <><CheckCircle2 className="w-5 h-5 mr-3" />¡Descarga completa!</>
            ) : (
              <><Download className="w-5 h-5 mr-3" />Descargar Exportación Completa</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
