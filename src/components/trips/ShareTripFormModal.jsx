import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseAPI } from '@/api/supabaseClient';
import { useUser } from '@clerk/clerk-react';

export default function ShareTripFormModal({ open, onClose }) {
  const { user: clerkUser } = useUser();
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName || clerkUser.username,
  } : null;

  const generateShareLink = async () => {
    if (!user) {
      toast.error('Debes estar autenticado');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate a unique token
      const token = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create shared form entry in database
      const sharedForm = await supabaseAPI.entities.SharedTripForm.create({
        share_token: token,
        agent_id: user.id,
        agent_email: user.email,
        agent_name: user.full_name,
        is_active: true,
        expires_at: null // No expiration by default
      });

      // Generate the full URL
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/public/trip-form/${token}`;
      setShareLink(link);

      toast.success('Link generado exitosamente');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Error al generar el link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link copiado al portapapeles');

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleClose = () => {
    setShareLink('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: '#2E442A' }}>
            <Share2 className="w-5 h-5" />
            Compartir Formulario de Viaje
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-stone-600">
            Genera un link único para compartir con tus clientes. Ellos podrán llenar
            el formulario con la información de su viaje deseado.
          </p>

          {!shareLink ? (
            <Button
              onClick={generateShareLink}
              disabled={isGenerating}
              className="w-full rounded-xl text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generando link...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Generar Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="share-link">Link para compartir</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareLink}
                    readOnly
                    className="rounded-xl font-mono text-sm"
                    onClick={(e) => e.target.select()}
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="rounded-xl flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(shareLink, '_blank')}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
                <Button
                  onClick={generateShareLink}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Generar nuevo link
                </Button>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Este link no expira. Puedes compartirlo por WhatsApp,
                  email o cualquier otro medio con tus clientes.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
