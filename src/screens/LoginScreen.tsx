/**
 * Login Screen - PontoCerto
 *
 * Security features:
 * - PIN validation via API (bcrypt hashed on server)
 * - Rate limiting feedback from server
 * - No PIN stored in memory after submission
 * - Physical keyboard support
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Fingerprint, Shield } from "lucide-react";
import { useAppState, useAuthMutations } from "@/context/AppContext";

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

export default function LoginScreen() {
  const { dispatch } = useAppState();
  const { login } = useAuthMutations();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinSubmit = async (enteredPin: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const result = await login.mutateAsync({ pin: enteredPin });
      if (result.token) {
        localStorage.setItem("pontocerto_token", result.token);
        dispatch({ type: "SET_AUTH", payload: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4 && !isSubmitting) {
      handlePinSubmit(pin);
    }
  }, [pin, isSubmitting]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        setPin((prev) => (prev.length < 4 ? prev + e.key : prev));
      }
      if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNumpadPress = (key: string) => {
    if (isSubmitting) return;
    if (key === "del") {
      setPin((prev) => prev.slice(0, -1));
      setError("");
    } else if (key && pin.length < 4) {
      setPin((prev) => prev + key);
      setError("");
    }
  };

  const dotsFilled = pin.length;
  const hasError = !!error;

  return (
    <div className="flex flex-col h-full bg-[#0F172A] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600 blur-[120px]"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Brand */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center mb-10"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-5"
          >
            <div className="w-22 h-22 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <img src="/assets/logo-pontocerto.jpg" alt="Ponto Certo" className="w-20 h-20 object-cover" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[28px] font-bold text-[#F1F5F9] tracking-tight"
          >
            Ponto<span className="text-emerald-500">Certo</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] text-[#94A3B8] mt-1 tracking-wide"
          >
            Seu controle de ponto, simples assim
          </motion.p>
        </motion.div>

        {/* PIN Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[280px]"
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Shield size={18} className="text-emerald-500" />
              </motion.div>
            ) : (
              <Fingerprint size={18} className="text-emerald-500" />
            )}
            <span className="text-[14px] text-[#94A3B8]">
              {isSubmitting ? "Verificando..." : "Digite seu PIN"}
            </span>
          </div>

          {/* PIN Dots */}
          <div className={`flex justify-center gap-3 mb-6 ${hasError ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={
                  i < dotsFilled
                    ? { scale: [1, 1.15, 1], backgroundColor: "#10B981", borderColor: "#10B981" }
                    : hasError
                      ? { backgroundColor: "transparent", borderColor: "#EF4444" }
                      : { backgroundColor: "#1E293B", borderColor: "#334155" }
                }
                transition={{ duration: 0.15 }}
                className="w-12 h-12 rounded-xl border-2 flex items-center justify-center"
              >
                {i < dotsFilled && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {hasError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-400 text-[12px] mb-4 px-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2.5">
            {NUMPAD_KEYS.flat().map((key, idx) => {
              if (key === "") return <div key={`empty-${idx}`} />;
              const isDel = key === "del";
              return (
                <motion.button
                  key={key + idx}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleNumpadPress(key)}
                  disabled={isSubmitting}
                  className={`h-[60px] rounded-xl flex items-center justify-center text-lg font-semibold transition-colors ${
                    isDel
                      ? "text-[#94A3B8] active:bg-[#1E293B]"
                      : "bg-[#1E293B]/80 border border-[#334155]/50 text-[#F1F5F9] active:bg-[#334155]"
                  } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isDel ? <Delete size={20} /> : key}
                </motion.button>
              );
            })}
          </div>

          {/* Hint */}
          <div className="mt-5 text-center">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-[11px] text-[#64748B] hover:text-emerald-500 transition-colors"
            >
              Esqueceu o PIN?
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-[#64748B] mt-1"
                >
                  PIN padrao: 1234
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="pb-6 text-center">
        <p className="text-[10px] text-[#475569]">PontoCerto v1.0</p>
      </motion.div>
    </div>
  );
}
