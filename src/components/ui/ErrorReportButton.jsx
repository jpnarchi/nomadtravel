import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ErrorReportDialog from './ErrorReportDialog';

export default function ErrorReportButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setDialogOpen(true)}
        className="fixed top-20 lg:top-6 right-6 z-40 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-white font-semibold text-sm transition-all hover:shadow-xl"
        style={{ backgroundColor: '#dc2626' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AlertCircle className="w-4 h-4" />
        Reportar Error
      </motion.button>

      <ErrorReportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
