import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

export default function Toast() {
  const { state } = useAppState();
  const toast = state.ui.toast;

  return (
    <AnimatePresence>
      {toast?.visible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        >
          <div className="bg-[#1E293B] shadow-lg rounded-xl px-5 py-3 flex items-center gap-2.5 max-w-[80%] pointer-events-auto">
            {toast.type === 'success' && (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            )}
            {(toast.type === 'error' || toast.type === 'warning') && (
              <AlertCircle
                size={16}
                className={toast.type === 'error' ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'}
              />
            )}
            <span className="text-[13px] text-[#F1F5F9] whitespace-nowrap">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
