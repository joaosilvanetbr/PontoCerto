import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

interface ModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  showClose?: boolean;
}

export default function Modal({ id, title, children, onClose, showClose = true }: ModalProps) {
  const { state, dispatch } = useAppState();
  const isOpen = state.ui.activeModal === id;

  const handleClose = () => {
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: null });
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative bg-[#1E293B] rounded-2xl p-6 w-[90%] max-w-[320px] z-10"
          >
            {showClose && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
              >
                <X size={18} />
              </button>
            )}
            <h3 className="text-lg font-semibold text-[#F1F5F9] mb-4">{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
