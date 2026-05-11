import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useToast } from '@/context/AppContext';
import { formatTime } from '@/lib/data';
import Modal from './Modal';

interface EntryEditorProps {
  entryId: string;
  entryType: string;
  timestamp: number;
  date: string;
  compact?: boolean;
}

export default function EntryEditor({ entryId, entryType, timestamp, date, compact }: EntryEditorProps) {
  const { dispatch } = useAppState();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState(formatTime(timestamp));
  const [, setShowDelete] = useState(false);

  const handleSave = () => {
    const [hours, minutes] = editTime.split(':').map(Number);
    const [year, month, dayNum] = date.split('-').map(Number);
    const newTimestamp = new Date(year, month - 1, dayNum, hours, minutes).getTime();

    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { id: entryId, timestamp: newTimestamp, date },
    });
    setIsEditing(false);
    showToast('Registro atualizado', 'success');
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_ENTRY', payload: entryId });
    setShowDelete(false);
    showToast('Registro removido', 'warning');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-[#334155]"
        >
          <Pencil size={13} className="text-[#64748B]" />
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-red-500/10"
        >
          <Trash2 size={13} className="text-[#64748B]" />
        </button>

        <Modal id={`edit-${entryId}`} title={`Editar ${entryType}`} onClose={() => setIsEditing(false)}>
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 text-[#F1F5F9] text-lg text-center focus:outline-none focus:border-emerald-500 mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 h-11 bg-[#334155] rounded-xl text-[#F1F5F9] font-medium text-sm"
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
        </Modal>

        <Modal id={`delete-${entryId}`} title="Confirmar exclusão" onClose={() => setShowDelete(false)}>
          <p className="text-[13px] text-[#94A3B8] mb-5">
            Deseja remover o registro de {entryType} às {formatTime(timestamp)}?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 h-11 bg-[#334155] rounded-xl text-[#F1F5F9] font-medium text-sm"
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
        </Modal>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isEditing && (
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
              className="h-9 bg-[#0F172A] border border-[#334155] rounded-lg px-2 text-[#F1F5F9] text-sm focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 active:bg-emerald-500/30"
            >
              <Check size={16} className="text-emerald-500" />
            </button>
            <button
              onClick={() => {
                setEditTime(formatTime(timestamp));
                setIsEditing(false);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#334155] active:bg-[#475569]"
            >
              <X size={16} className="text-[#94A3B8]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEditing && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-[#334155]"
          >
            <Pencil size={13} className="text-[#64748B]" />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-red-500/10"
          >
            <Trash2 size={13} className="text-[#64748B]" />
          </button>
        </div>
      )}

      <Modal id={`delete-${entryId}`} title="Confirmar exclusão" onClose={() => setShowDelete(false)}>
        <p className="text-[13px] text-[#94A3B8] mb-5">
          Deseja remover o registro de {entryType} às {formatTime(timestamp)}?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDelete(false)}
            className="flex-1 h-11 bg-[#334155] rounded-xl text-[#F1F5F9] font-medium text-sm"
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
      </Modal>
    </>
  );
}
