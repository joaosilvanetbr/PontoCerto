import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

const NUMPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export default function LoginScreen() {
  const { state, dispatch } = useAppState();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePinSubmit = useCallback(
    (enteredPin: string) => {
      if (enteredPin === state.profile.pin) {
        dispatch({ type: 'SET_AUTH', payload: true });
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setPin('');
        }, 800);
      }
    },
    [state.profile.pin, dispatch]
  );

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit(pin);
    }
  }, [pin, handlePinSubmit]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPin(prev => (prev.length < 4 ? prev + e.key : prev));
      }
      if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNumpadPress = (key: string) => {
    if (key === 'del') {
      setPin(prev => prev.slice(0, -1));
    } else if (key && pin.length < 4) {
      setPin(prev => prev + key);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#0F172A]"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 animate-breathe"
      >
        <img
          src="/assets/logo-icon.jpg"
          alt="Ponto Fácil"
          className="w-20 h-20 rounded-2xl object-cover"
        />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[28px] font-bold text-[#F1F5F9] mb-1"
      >
        Ponto Fácil
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[13px] text-[#94A3B8] mb-12"
      >
        Controle de Ponto Digital
      </motion.p>

      {/* PIN Display */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[15px] text-[#94A3B8] mb-6"
      >
        Digite seu PIN
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`flex gap-4 mb-8 ${error ? 'animate-shake' : ''}`}
      >
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-[32px] font-bold tracking-widest transition-all duration-150 ${
              i < pin.length
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : error
                ? 'border-red-500 bg-transparent'
                : 'border-[#334155] bg-[#1E293B]'
            }`}
          >
            {i < pin.length ? (error ? '' : '\u2022') : ''}
          </div>
        ))}
      </motion.div>

      {/* Numpad */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-3 w-full max-w-[280px]"
      >
        {NUMPAD_KEYS.flat().map((key, idx) => {
          if (key === '') {
            return <div key={idx} />;
          }
          const isDel = key === 'del';
          return (
            <motion.button
              key={key + idx}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleNumpadPress(key)}
              className={`h-[72px] rounded-xl flex items-center justify-center transition-colors duration-100 ${
                isDel
                  ? 'bg-transparent text-[#F1F5F9]'
                  : 'bg-[#1E293B] border border-[#334155] text-[#F1F5F9] active:bg-[#334155]'
              }`}
            >
              {isDel ? <Delete size={24} /> : <span className="text-xl font-semibold">{key}</span>}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[11px] text-[#64748B] mt-8"
      >
        PIN padrão: 1234
      </motion.p>
    </motion.div>
  );
}
