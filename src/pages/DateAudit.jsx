import React, { useState } from 'react';
import { supabaseAPI } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, Calendar, Database } from 'lucide-react';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DateAudit() {
  const [auditing, setAuditing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [showFixConfirm, setShowFixConfirm] = useState(false);

  const handleAudit = async () => {
    setAuditing(true);
    try {
      const response = await base44.functions.invoke('auditDates', {});
      setAuditResults(response.data);
      
      if (response.data.totalIssues === 0) {
        toast.success('¡Excelente! No se encontraron problemas de fechas');
      } else {
        toast.warning(`Se encontraron ${response.data.totalIssues} registros con problemas`);
      }
    } catch (error) {
      toast.error('Error al auditar fechas');
      console.error(error);
    } finally {
      setAuditing(false);
    }
  };

  const handleFix = async () => {
    setFixing(true);
    try {
      const response = await base44.functions.invoke('fixDates', {
        issues: auditResults.issues
      });
      
      toast.success(`✅ ${response.data.fixed} registros corregidos`);
      if (response.data.errors > 0) {
        toast.error(`⚠️ ${response.data.errors} errores al corregir`);
      }
      
      // Re-auditar después de corregir
      setTimeout(() => handleAudit(), 1000);
    } catch (error) {
      toast.error('Error al corregir fechas');
      console.error(error);
    } finally {
      setFixing(false);
      setShowFixConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
              <Calendar className="w-7 h-7" style={{ color: '#2E442A' }} />
              Auditoría de Fechas
            </h1>
            <p className="text-sm text-stone-500 mt-2">
              Detecta y corrige fechas que se han corrido un día debido a conversiones de zona horaria
            </p>
          </div>
          <Button
            onClick={handleAudit}
            disabled={auditing}
            size="lg"
            className="text-white"
            style={{ backgroundColor: '#2E442A' }}
          >
            {auditing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Database className="w-4 h-4 mr-2" />
            Ejecutar Auditoría
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      {auditResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-stone-500">Total Registros Analizados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" style={{ color: '#2E442A' }}>
                {Object.values(auditResults.summary.byEntity || {}).reduce((a, b) => a + b, 0)}
              </p>
            </CardContent>
          </Card>

          <Card className={auditResults.totalIssues > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-stone-500">Registros con Problemas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className={`text-3xl font-bold ${auditResults.totalIssues > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {auditResults.totalIssues}
                </p>
                {auditResults.totalIssues === 0 && <CheckCircle className="w-6 h-6 text-green-600" />}
                {auditResults.totalIssues > 0 && <AlertTriangle className="w-6 h-6 text-orange-600" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-stone-500">Entidades Afectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {Object.keys(auditResults.summary.byEntity || {}).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary by Entity */}
      {auditResults && auditResults.totalIssues > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumen por Entidad</CardTitle>
              <Button
                onClick={() => setShowFixConfirm(true)}
                disabled={fixing}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {fixing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Corregir Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(auditResults.summary.byEntity).map(([entity, count]) => (
                <div key={entity} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">{entity}</p>
                  <p className="text-2xl font-bold text-orange-600">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Issues */}
      {auditResults && auditResults.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registros con Problemas Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditResults.issues.map((issue, index) => (
                <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{issue.entityName}</Badge>
                        <Badge variant="outline" className="text-xs">{issue.fieldName}</Badge>
                      </div>
                      <p className="text-xs text-stone-600 mb-1">ID: {issue.recordId}</p>
                      <p className="text-xs text-orange-700">{issue.reason}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-stone-500">Shift: <span className="font-semibold text-orange-600">{issue.dayShift} día(s)</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fix Confirmation Dialog */}
      <AlertDialog open={showFixConfirm} onOpenChange={setShowFixConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Corregir todas las fechas?</AlertDialogTitle>
            <AlertDialogDescription>
              Se corregirán {auditResults?.totalIssues} registros automáticamente.
              Las fechas se ajustarán a la zona horaria America/Monterrey.
              Esta acción modificará los datos en la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFix}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Sí, Corregir Fechas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}