import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { supabaseAPI } from '@/api/supabaseClient';
import { useUser } from '@clerk/clerk-react';
import { useToast } from "@/components/ui/use-toast";

const PAGES = [
  { value: 'Dashboard', label: 'Dashboard' },
  { value: 'Clients', label: 'Clientes' },
  { value: 'Trips', label: 'Viajes' },
  { value: 'SoldTrips', label: 'Viajes Vendidos' },
  { value: 'Commissions', label: 'Comisiones' },
  { value: 'Statistics', label: 'Estadísticas' },
  { value: 'Suppliers', label: 'Proveedores' },
  { value: 'Reviews', label: 'Learning & Reviews' },
  { value: 'Credentials', label: 'Contraseñas' },
  { value: 'PersonalCredentials', label: 'Mis Contraseñas' },
  { value: 'Attendance', label: 'Asistencia' },
  { value: 'FamTrips', label: 'FAM Trips' },
  { value: 'IndustryFairs', label: 'Ferias' },
  { value: 'AdminDashboard', label: 'Dashboard Global (Admin)' },
  { value: 'AdminClients', label: 'Todos los Clientes (Admin)' },
  { value: 'AdminTrips', label: 'Todos los Viajes (Admin)' },
  { value: 'AdminSoldTrips', label: 'Viajes Vendidos (Admin)' },
  { value: 'InternalCommissions', label: 'Comisiones Internas (Admin)' },
  { value: 'InternalPayments', label: 'Pagos Internos Proveedores (Admin)' },
  { value: 'InternalClientPayments', label: 'Pagos Internos Clientes (Admin)' },
  { value: 'Other', label: 'Otra página' },
];

export default function ErrorReportDialog({ open, onClose }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [page, setPage] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!page || !description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl = null;

      // Subir captura si existe
      if (screenshot) {
        try {
          const uploadResult = await supabaseAPI.storage.uploadFile(
            screenshot,
            'error-reports',
            'screenshots'
          );
          screenshotUrl = uploadResult.file_url;
        } catch (uploadError) {
          console.warn('Error uploading screenshot, proceeding without it:', uploadError);
          // Continuar sin la captura si falla la subida
        }
      }

      // Crear el reporte de error
      await supabaseAPI.entities.ErrorReport.create({
        page,
        description,
        screenshot_url: screenshotUrl,
        reported_by: user?.id,
        reporter_email: user?.primaryEmailAddress?.emailAddress,
        reporter_name: user?.fullName || user?.username,
        status: 'pending',
        created_date: new Date().toISOString(),
      });

      toast({
        title: "Reporte enviado",
        description: screenshotUrl
          ? "Tu reporte de error ha sido enviado exitosamente"
          : "Tu reporte ha sido enviado (sin captura de pantalla)",
      });

      // Limpiar formulario
      setPage('');
      setDescription('');
      setScreenshot(null);
      setScreenshotPreview(null);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Reportar Error</DialogTitle>
          <DialogDescription>
            Describe el error que encontraste para que podamos solucionarlo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Selector de página */}
          <div className="space-y-2">
            <Label htmlFor="page">Página donde ocurrió el error *</Label>
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una página" />
              </SelectTrigger>
              <SelectContent>
                {PAGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción del error */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción del error *</Label>
            <Textarea
              id="description"
              placeholder="Describe detalladamente qué error encontraste y qué estabas intentando hacer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Captura de pantalla */}
          <div className="space-y-2">
            <Label>Captura de pantalla (opcional)</Label>
            {!screenshotPreview ? (
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="screenshot"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="screenshot"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-stone-400" />
                  <span className="text-sm text-stone-600">
                    Haz clic para subir una captura
                  </span>
                  <span className="text-xs text-stone-400">
                    PNG, JPG hasta 10MB
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Preview"
                  className="w-full h-48 object-contain border rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enviar Reporte
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
