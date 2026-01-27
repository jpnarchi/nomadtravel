import React, { useEffect, useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  in_progress: {
    label: 'En Progreso',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: AlertCircle,
  },
  resolved: {
    label: 'Resuelto',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
  },
};

export default function ErrorReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await supabaseAPI.entities.ErrorReport.list('-created_date');
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reportId, newStatus) => {
    try {
      await supabaseAPI.entities.ErrorReport.update(reportId, {
        status: newStatus,
      });
      fetchReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Reportes de Errores</h1>
        <p className="text-stone-600 mt-2">Administra los reportes de errores del sistema</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={CheckCircle}
              title="No hay reportes de errores"
              description="¡Excelente! No hay errores reportados en este momento."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todos los Reportes</CardTitle>
            <CardDescription>
              Total de reportes: {reports.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={report.id}>
                      <TableCell className="text-sm text-stone-600">
                        {format(new Date(report.created_date), 'dd MMM yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {report.page}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{report.reporter_name}</p>
                          <p className="text-xs text-stone-500">{report.reporter_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-stone-700 truncate">
                          {report.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Reporte</DialogTitle>
            <DialogDescription>
              Reportado el {selectedReport && format(new Date(selectedReport.created_date), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 mt-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">Estado:</span>
                <div className="flex gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedReport.status === status ? "default" : "outline"}
                        onClick={() => updateStatus(selectedReport.id, status)}
                        className="h-8"
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Page */}
              <div>
                <span className="text-sm font-medium text-stone-700">Página:</span>
                <Badge variant="outline" className="ml-2">
                  {selectedReport.page}
                </Badge>
              </div>

              {/* Reporter */}
              <div>
                <span className="text-sm font-medium text-stone-700">Reportado por:</span>
                <div className="mt-1">
                  <p className="text-sm font-medium">{selectedReport.reporter_name}</p>
                  <p className="text-xs text-stone-500">{selectedReport.reporter_email}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-sm font-medium text-stone-700">Descripción:</span>
                <p className="mt-2 text-sm text-stone-600 bg-stone-50 p-3 rounded-lg border">
                  {selectedReport.description}
                </p>
              </div>

              {/* Screenshot */}
              {selectedReport.screenshot_url && (
                <div>
                  <span className="text-sm font-medium text-stone-700">Captura de pantalla:</span>
                  <div className="mt-2">
                    <a
                      href={selectedReport.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={selectedReport.screenshot_url}
                        alt="Screenshot"
                        className="w-full rounded-lg border hover:opacity-80 transition-opacity"
                      />
                      <Button variant="link" className="mt-2 p-0 h-auto">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Abrir en nueva pestaña
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
