import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isToday } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Plus, Trash2, ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from '@/components/ui/EmptyState';

export default function TasksList({ tasks, onToggle, onDelete, onCreate }) {
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_date: '' });

  const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => 
    new Date(a.due_date) - new Date(b.due_date)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask.title && newTask.due_date) {
      onCreate(newTask);
      setNewTask({ title: '', due_date: '' });
      setShowForm(false);
    }
  };

  const getPriorityColor = (dueDate) => {
    if (!dueDate) return 'text-stone-400';
    if (isPast(new Date(dueDate)) && !isToday(new Date(dueDate))) return 'text-red-500';
    if (isToday(new Date(dueDate))) return 'text-orange-500';
    return 'text-stone-400';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
      <div className="p-6 border-b border-stone-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-800">Tareas Pendientes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs"
          style={{ color: '#2E442A' }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nueva
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-stone-100"
          >
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <Input
                placeholder="Título de la tarea"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="rounded-lg text-sm flex-1"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  className="text-white"
                  style={{ backgroundColor: '#2E442A' }}
                >
                  Agregar
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin tareas pendientes"
          description="¡Excelente! No tienes tareas por completar"
        />
      ) : (
        <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
          {pendingTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 flex items-start gap-3 hover:bg-stone-50 transition-colors group"
            >
              <button
                onClick={() => onToggle(task)}
                className="mt-0.5 text-stone-300 hover:text-green-500 transition-colors"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-700 truncate">{task.title}</p>
                <p className={`text-xs mt-0.5 ${getPriorityColor(task.due_date)}`}>
                  {format(parseLocalDate(task.due_date), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
              <button
                onClick={() => onDelete(task)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}