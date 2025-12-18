import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hotel, Building2, Compass, Plane, Car, Train, DollarSign, BookOpen } from 'lucide-react';

const CHEAT_SHEETS = [
  { id: 'hoteles', label: 'Hoteles', icon: Hotel, color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'dmc', label: 'DMC', icon: Building2, color: 'bg-indigo-500 hover:bg-indigo-600' },
  { id: 'tours', label: 'Tours', icon: Compass, color: 'bg-emerald-500 hover:bg-emerald-600' },
  { id: 'aviones', label: 'Aviones', icon: Plane, color: 'bg-purple-500 hover:bg-purple-600' },
  { id: 'traslados', label: 'Traslados', icon: Car, color: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'trenes', label: 'Trenes', icon: Train, color: 'bg-pink-500 hover:bg-pink-600' },
  { id: 'comisiones', label: 'Comisiones', icon: DollarSign, color: 'bg-green-500 hover:bg-green-600' }
];

export default function CheatSheetBar() {
  const [openModal, setOpenModal] = useState(null);

  const currentSheet = CHEAT_SHEETS.find(s => s.id === openModal);

  return (
    <>
      {/* Floating Cheat Sheet Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white shadow-2xl rounded-2xl border border-stone-200 p-2 flex items-center gap-2">
          <div className="flex items-center gap-1 px-2">
            <BookOpen className="w-4 h-4" style={{ color: '#2E442A' }} />
            <span className="text-xs font-semibold text-stone-700">Guías Rápidas</span>
          </div>
          <div className="h-6 w-px bg-stone-200" />
          {CHEAT_SHEETS.map((sheet) => {
            const Icon = sheet.icon;
            return (
              <Button
                key={sheet.id}
                size="sm"
                onClick={() => setOpenModal(sheet.id)}
                className={`${sheet.color} text-white h-8 px-3 rounded-lg text-xs font-medium shadow-sm`}
              >
                <Icon className="w-3.5 h-3.5 mr-1" />
                {sheet.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!openModal} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: '#2E442A' }}>
              {currentSheet && <currentSheet.icon className="w-5 h-5" />}
              Guía Rápida: {currentSheet?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 text-center text-stone-500">
              <p className="text-sm">Contenido de la guía para {currentSheet?.label} próximamente...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}