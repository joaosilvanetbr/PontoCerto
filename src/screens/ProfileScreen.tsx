import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Bell, Moon, FileText, Trash2, LogOut,
} from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import Modal from '@/components/Modal';

export default function ProfileScreen() {
  const { state, dispatch } = useAppState();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [, setShowClearConfirm] = useState(false);

  const scheduleItems = [
    { key: 'workStartTime', label: 'Horário de Entrada', value: state.profile.workStartTime },
    { key: 'workEndTime', label: 'Horário de Saída', value: state.profile.workEndTime },
    { key: 'lunchDuration', label: 'Duração do Almoço', value: `${state.profile.lunchDuration} min` },
    { key: 'dailyTarget', label: 'Meta Diária', value: `${Math.floor(state.profile.dailyTarget)}h ${Math.round((state.profile.dailyTarget % 1) * 60)}min` },
  ];

  const handleEditField = (key: string) => {
    setEditingField(key);
    const item = scheduleItems.find(i => i.key === key);
    setEditValue(item?.value || '');
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: `edit-${key}` });
  };

  const handleSaveEdit = () => {
    if (!editingField) return;
    const updates: Record<string, string | number> = {};
    if (editingField === 'lunchDuration') {
      updates[editingField] = parseInt(editValue) || 60;
    } else if (editingField === 'dailyTarget') {
      updates[editingField] = parseInt(editValue) || 8;
    } else {
      updates[editingField] = editValue;
    }
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: null });
    setEditingField(null);
  };

  const handleSignOut = () => {
    dispatch({ type: 'SET_AUTH', payload: false });
  };

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: null });
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 pt-5 pb-4"
      >
        <h1 className="text-[28px] font-bold text-[#F1F5F9]">Perfil</h1>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Profile Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, delay: 0.1 }}
          className="bg-[#1E293B] rounded-2xl p-6 flex flex-col items-center mb-5"
        >
          <div className="relative mb-4">
            <img
              src={state.profile.avatar}
              alt={state.profile.name}
              className="w-20 h-20 rounded-full object-cover border-[3px] border-emerald-500"
            />
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">{state.profile.name}</h2>
          <p className="text-[15px] text-[#94A3B8] mt-0.5">{state.profile.company}</p>
          <p className="text-[13px] text-[#64748B] mt-0.5">{state.profile.role}</p>
        </motion.div>

        {/* Work Schedule */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <h3 className="text-base font-semibold text-[#F1F5F9] mb-3">Jornada de Trabalho</h3>
          <div className="space-y-2">
            {scheduleItems.map((item, idx) => (
              <motion.button
                key={item.key}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => handleEditField(item.key)}
                className="w-full bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-[#334155] transition-colors"
              >
                <span className="text-[15px] text-[#F1F5F9]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#94A3B8]">{item.value}</span>
                  <ChevronRight size={16} className="text-[#64748B]" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-5"
        >
          <h3 className="text-base font-semibold text-[#F1F5F9] mb-3">Configurações</h3>
          <div className="space-y-2">
            {/* Notifications */}
            <div className="bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#94A3B8]" />
                <span className="text-[15px] text-[#F1F5F9]">Notificações</span>
              </div>
              <button
                onClick={() => setNotificationsOn(!notificationsOn)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  notificationsOn ? 'bg-emerald-500' : 'bg-[#334155]'
                }`}
              >
                <motion.div
                  animate={{ x: notificationsOn ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
                />
              </button>
            </div>

            {/* Dark Mode (always on) */}
            <div className="bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-[#94A3B8]" />
                <span className="text-[15px] text-[#F1F5F9]">Modo Escuro</span>
              </div>
              <div className="w-12 h-7 rounded-full bg-emerald-500 relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-sm" />
              </div>
            </div>

            {/* Export All Data */}
            <button
              onClick={() => {
                const csv = `data:text/csv;charset=utf-8,${encodeURIComponent(
                  'Data,Tipo,Horario\n' +
                  state.entries.map(e => `${e.date},${e.type},${new Date(e.timestamp).toLocaleTimeString('pt-BR')}`).join('\n')
                )}`;
                const link = document.createElement('a');
                link.href = csv;
                link.download = `ponto_completo_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              className="w-full bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-[#334155] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[#94A3B8]" />
                <span className="text-[15px] text-[#F1F5F9]">Exportar Todos os Dados</span>
              </div>
              <ChevronRight size={16} className="text-[#64748B]" />
            </button>

            {/* Clear All Data */}
            <button
              onClick={() => {
                setShowClearConfirm(true);
                dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'clear-confirm' });
              }}
              className="w-full bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-[#334155] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-red-500" />
                <span className="text-[15px] text-red-500">Limpar Todos os Dados</span>
              </div>
              <ChevronRight size={16} className="text-red-500/50" />
            </button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 mb-4"
        >
          <button
            onClick={handleSignOut}
            className="w-full bg-[#1E293B] rounded-xl px-4 py-4 flex items-center justify-center gap-3 active:bg-[#334155] transition-colors"
          >
            <LogOut size={18} className="text-red-500" />
            <span className="text-[15px] text-red-500 font-medium">Sair da Conta</span>
          </button>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {editingField && (
        <Modal
          id={`edit-${editingField}`}
          title="Editar"
          onClose={() => {
            setEditingField(null);
            setEditValue('');
          }}
        >
          <input
            type={editingField === 'lunchDuration' || editingField === 'dailyTarget' ? 'number' : 'text'}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 text-[#F1F5F9] text-base focus:outline-none focus:border-emerald-500 mb-4"
            autoFocus
          />
          <button
            onClick={handleSaveEdit}
            className="w-full h-12 bg-emerald-500 rounded-xl text-white font-semibold active:bg-emerald-600 transition-colors"
          >
            Salvar
          </button>
        </Modal>
      )}

      {/* Clear Confirm Modal */}
      <Modal
        id="clear-confirm"
        title="Limpar Todos os Dados"
        onClose={() => setShowClearConfirm(false)}
      >
        <p className="text-[13px] text-[#94A3B8] mb-6">
          Tem certeza que deseja apagar todos os registros? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowClearConfirm(false);
              dispatch({ type: 'SET_ACTIVE_MODAL', payload: null });
            }}
            className="flex-1 h-12 bg-[#334155] rounded-xl text-[#F1F5F9] font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleClearData}
            className="flex-1 h-12 bg-red-500 rounded-xl text-white font-semibold"
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}
