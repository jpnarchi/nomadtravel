import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Plus, Trash2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TripNotesList({ notes = [], onCreate, onUpdate, onDelete, isLoading }) {
  const [newNote, setNewNote] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleCreate = () => {
    if (!newNote.trim()) return;
    onCreate({
      content: newNote,
      is_urgent: isUrgent
    });
    setNewNote('');
    setIsUrgent(false);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1;
    if (!a.is_urgent && b.is_urgent) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div className="space-y-4">
      {/* New Note Form */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
        <Textarea
          placeholder="Escribe una nota o pendiente sobre este viaje..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="rounded-xl resize-none"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="urgent"
              checked={isUrgent}
              onCheckedChange={setIsUrgent}
            />
            <label htmlFor="urgent" className="text-sm text-stone-600 cursor-pointer flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Marcar como urgente (aparecerá en tareas)
            </label>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newNote.trim() || isLoading}
            className="rounded-xl text-white"
            style={{ backgroundColor: '#2E442A' }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar Nota
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-xl border transition-all ${
                note.is_urgent
                  ? 'bg-red-50 border-red-200'
                  : note.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={note.completed}
                  onCheckedChange={(checked) => onUpdate(note.id, { completed: checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {format(new Date(note.created_date), 'd MMM yyyy', { locale: es })}
                    </span>
                    <span className="text-xs text-stone-400">
                      {format(new Date(note.created_date), 'HH:mm', { locale: es })}
                    </span>
                  </div>
                  <p className={`text-sm ${note.completed ? 'line-through text-stone-500' : 'text-stone-700'}`}>
                    {note.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {note.is_urgent && !note.completed && (
                      <Badge className="bg-red-500 text-white text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Urgente
                      </Badge>
                    )}
                    {note.completed && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                    <span className="text-xs text-stone-400">
                      por {note.created_by}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-stone-400 hover:text-red-500"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sortedNotes.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <p className="text-sm">No hay notas. Agrega la primera nota o pendiente.</p>
          </div>
        )}
      </div>
    </div>
  );
}