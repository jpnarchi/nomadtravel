import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, CreditCard, DollarSign, Landmark, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
      title={`Copiar ${label}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-stone-400" />
      )}
    </button>
  );
};

const AccountField = ({ label, value }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-stone-500">{label}:</span>
    <div className="flex items-center gap-1">
      <span className="text-sm font-mono font-medium text-stone-800">{value}</span>
      <CopyButton text={value} label={label} />
    </div>
  </div>
);

export default function PaymentInfoModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: '#2E442A' }}>
            <Landmark className="w-5 h-5" />
            Información de Pagos - Nomad Travel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Pesos Mexicanos */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-green-700" />
              <h3 className="font-semibold text-green-800">PESOS MEXICANOS - BBVA</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-stone-600 font-medium">Nomad Trotamundos SA. de CV.</p>
              <AccountField label="Cuenta" value="0123468666" />
              <AccountField label="CLABE" value="012580001234686668" />
            </div>
          </div>

          {/* Dólares - Banco Base */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-700" />
              <h3 className="font-semibold text-blue-800">DÓLARES - BANCO BASE</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-stone-600 font-medium">Nomad Trotamundos SA. de CV.</p>
              <AccountField label="SPID" value="4558045987360214" />
              <AccountField label="CLABE" value="145580459873602014" />
            </div>
          </div>

          {/* Dólares - USA */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-purple-700" />
              <h3 className="font-semibold text-purple-800">DÓLARES - DENTRO DE USA</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-stone-600 font-medium">Nomad Travel LLC</p>
              <AccountField label="Account Number" value="822001064274" />
              <AccountField label="Account Type" value="Checking" />
              <AccountField label="Routing Number" value="026073150" />
              <AccountField label="SWIFT/BIC" value="CMFGUS33" />
              <div className="pt-2 text-xs text-stone-500">
                <p>Bank: Community Federal Savings Bank</p>
                <p>89-16 Jamaica Ave, Woodhaven, NY, 11421, United States</p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Crédito */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-amber-700" />
              <h3 className="font-semibold text-amber-800">PAGO CON TARJETA DE CRÉDITO</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-stone-600">Se cobra en USD al tipo de cambio de tu banco ese día.</p>
              <div className="bg-amber-100 rounded-lg p-2 text-xs text-amber-800">
                <strong>Importante:</strong> Los pagos con tarjeta de crédito o débito tienen un cargo adicional del 4% sobre el total para cubrir las comisiones de la plataforma de pagos.
              </div>
              <a 
                href="https://square.link/u/ztZmgn5R" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Pagar con Tarjeta
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}