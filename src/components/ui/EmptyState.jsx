import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {Icon && (
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: '#2E442A15' }}
        >
          <Icon className="w-10 h-10" style={{ color: '#2E442A' }} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-stone-800 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 text-center max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="text-white"
          style={{ backgroundColor: '#2E442A' }}
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}