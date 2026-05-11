import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntryMutations, useToast } from '@/context/AppContext';
import { formatTime } from '@/lib/data';

interface EntryEditorProps {
  entryId: string | number;
  entryType: string;
  timestamp: number;
  date: string;
  compact?: boolean;
}

export default function EntryEditor({ entryId, entryType, timestamp, date, compact }: EntryEditorProps) {
  const { updateEntry, deleteEntry } = useEntryMutations();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState(formatTime(timestamp));
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    const [hours, minutes] = editTime.split(':').map(Number);
    const [year, month, dayNum] = date.split('-').map(Number);
    const newTimestamp = new Date(year, month - 1, dayNum, hours, minutes).getTime();

    await updateEntry.mutateAsync({
      id: Number(entryId),
      timestamp: newTimestamp,
      date,
    });
    setIsEditing(false);
    showToast('Registro atualizado', 'success');
  };

  const handleDelete = async () => {
    await deleteEntry.mutateAsync({ id: Number(entryId) });
    setShowConfirm(false);
    showToast('Registro removido', 'warning');
  };

  const buttons = (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setIsEditing(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-app-border/50"
      >
        <Pencil size={13} className="text-app-muted" />
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-red-500/10"
      >
        <Trash2 size={13} className="text-app-muted" />
      </button>
    </div>
  );

  if (compact) {
    return (
      <>
        {buttons}

        {/* Edit inline */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
              onClick={() => setIsEditing(false)}
            >
              <div className="bg-app-card rounded-2xl p-6 w-[85%] max-w-[300px]" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-app mb-4">Editar {entryType}</h3>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full h-12 bg-app-input border border-app rounded-xl px-4 text-app text-lg text-center focus:outline-none focus:border-emerald-500 mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 h-11 bg-app-border rounded-xl text-app font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 h-11 bg-emerald-500 rounded-xl text-white font-medium text-sm"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirm */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
              onClick={() => setShowConfirm(false)}
            >
              <div className="bg-app-card rounded-2xl p-6 w-[85%] max-w-[300px]" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-app mb-3">Confirmar exclusão</h3>
                <p className="text-[13px] text-app-secondary mb-5">
                  Remover registro de {entryType} às {formatTime(timestamp)}?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 h-11 bg-app-border rounded-xl text-app font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 h-11 bg-red-500 rounded-xl text-white font-medium text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 mt-2"
        >
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="h-9 bg-app-input border border-app rounded-lg px-2 text-app text-sm focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <button onClick={handleSave} className="h-9 px-3 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm font-medium active:bg-emerald-500/30">
            Salvar
          </button>
          <button onClick={() => { setEditTime(formatTime(timestamp)); setIsEditing(false); }} className="h-9 px-3 rounded-lg bg-app-border text-app-secondary text-sm active:bg-app-border/80">
            Cancelar
          </button>
        </motion.div>
      ) : (
        buttons
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
            onClick={() => setShowConfirm(false)}
          >
            <div className="bg-app-card rounded-2xl p-6 w-[85%] max-w-[300px]" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-app mb-3">Confirmar exclusão</h3>
              <p className="text-[13px] text-app-secondary mb-5">
                Remover registro de {entryType} às {formatTime(timestamp)}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-11 bg-app-border rounded-xl text-app font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 h-11 bg-red-500 rounded-xl text-white font-medium text-sm"
                >
                  Remover
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
