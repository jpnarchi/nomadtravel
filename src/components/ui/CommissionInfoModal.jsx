import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Wallet, Clock, FileCheck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const CopyAllButton = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Información copiada');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className="mt-3 w-full text-xs"
    >
      {copied ? (
        <><Check className="w-3 h-3 mr-1 text-green-600" /> Copiado</>
      ) : (
        <><Copy className="w-3 h-3 mr-1" /> Copiar todo</>
      )}
    </Button>
  );
};

const BANK_INFO = `Nomad Travel LLC
Address: 3702 San Efrain, Mission, Texas 78572, USA
TAX ID: 99-0692205
Email: maria.salinas@nomadtravel.mx

Receiving Bank Details
SWIFT / BIC: CHFGUS44021
ABA Routing Number: 091311229
Bank Name: Choice Financial Group
Bank Address: 4501 23rd Avenue S, Fargo, ND 58104, USA
IBAN / Account Number: 202568135540
Beneficiary Name: Nomad Travel LLC
Beneficiary Address: 3702 San Efrain Street, Mission, TX 78572, USA`;

export default function CommissionInfoModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: '#2E442A' }}>
            <Wallet className="w-5 h-5" />
            Cómo funcionan las comisiones en Nomad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Info General */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <p className="text-sm text-stone-700 leading-relaxed">
              Las comisiones en Nomad se pagan <strong>después de que el cliente viaja</strong>.
            </p>
          </div>

          {/* Importante YTC */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start gap-2">
              <FileCheck className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Todas las comisiones de Montecito se deben subir a YTC, porque solo así pueden ser procesadas y pagadas correctamente.
              </p>
            </div>
          </div>

          {/* Tiempos */}
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Pagos Brutos</p>
                  <p className="text-sm text-blue-700">Tardan alrededor de <strong>dos meses</strong> en llegar después del viaje.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Pagos Netos</p>
                  <p className="text-sm text-green-700">Se liberan <strong>en cuanto el viaje ha finalizado</strong>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-purple-700" />
              <h3 className="font-semibold text-purple-800">Información para pago directo de proveedores</h3>
            </div>
            <p className="text-xs text-purple-700 mb-3">
              Si un proveedor necesita pagarte comisiones directamente, comparte esta información:
            </p>
            <div className="bg-white rounded-lg p-3 text-xs space-y-2 text-stone-700 font-mono">
              <p className="font-semibold text-stone-800">Nomad Travel LLC</p>
              <p>Address: 3702 San Efrain, Mission, Texas 78572, USA</p>
              <p>TAX ID: 99-0692205</p>
              <p>Email: maria.salinas@nomadtravel.mx</p>
              
              <div className="border-t border-stone-200 pt-2 mt-2">
                <p className="font-semibold text-stone-800">Receiving Bank Details</p>
                <p>SWIFT / BIC: CHFGUS44021</p>
                <p>ABA Routing Number: 091311229</p>
                <p>Bank Name: Choice Financial Group</p>
                <p>Bank Address: 4501 23rd Avenue S, Fargo, ND 58104, USA</p>
                <p>IBAN / Account Number: 202568135540</p>
                <p>Beneficiary Name: Nomad Travel LLC</p>
                <p>Beneficiary Address: 3702 San Efrain Street, Mission, TX 78572, USA</p>
              </div>
            </div>
            <CopyAllButton text={BANK_INFO} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}