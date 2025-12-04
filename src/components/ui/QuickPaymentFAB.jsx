import React, { useState } from 'react';
import { Plus, X, User, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import QuickPaymentDialog from './QuickPaymentDialog';

export default function QuickPaymentFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentType, setPaymentType] = useState(null);

  const handleOpenPayment = (type) => {
    setPaymentType(type);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  onClick={() => handleOpenPayment('client')}
                  className="rounded-full shadow-lg flex items-center gap-2 pr-4"
                  style={{ backgroundColor: '#2E442A' }}
                >
                  <User className="w-4 h-4" />
                  Pago de Cliente
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.15, delay: 0.05 }}
              >
                <Button
                  onClick={() => handleOpenPayment('supplier')}
                  className="rounded-full shadow-lg flex items-center gap-2 pr-4"
                  style={{ backgroundColor: '#2E442A' }}
                >
                  <Building2 className="w-4 h-4" />
                  Pago a Proveedor
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
          style={{ backgroundColor: '#2E442A' }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>

      <QuickPaymentDialog
        open={!!paymentType}
        onClose={() => setPaymentType(null)}
        type={paymentType}
      />
    </>
  );
}