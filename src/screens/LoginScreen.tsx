import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Fingerprint } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { trpc } from "@/utils/trpc";

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

export default function LoginScreen() {
  const { dispatch } = useAppState();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("pontocerto_token", data.token);
      dispatch({ type: "SET_AUTH", payload: true });
    },
    onError: () => {
      setError(true);
      setTimeout(() => {
        setError(false);
        setPin("");
      }, 800);
    },
  });

  useEffect(() => {
    if (pin.length === 4) {
      loginMutation.mutate({ pin });
    }
  }, [pin]);

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
    if (key === "del") {
      setPin((prev) => prev.slice(0, -1));
    } else if (key && pin.length < 4) {
      setPin((prev) => prev + key);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600 blur-[120px]"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Brand Section */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center mb-12"
        >
          {/* Logo */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <img
                src="/assets/logo-pontocerto.jpg"
                alt="Ponto Certo"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[32px] font-bold text-[#F1F5F9] tracking-tight"
          >
            Ponto<span className="text-emerald-500">Certo</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[14px] text-[#94A3B8] mt-1.5 tracking-wide"
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
          {/* Security icon + label */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Fingerprint size={18} className="text-emerald-500" />
            <span className="text-[15px] text-[#94A3B8]">Digite seu PIN</span>
          </div>

          {/* PIN Dots */}
          <div
            className={`flex justify-center gap-4 mb-8 ${error ? "animate-shake" : ""}`}
            onAnimationEnd={() => error && setTimeout(() => setError(false), 100)}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={
                  i < pin.length
                    ? { scale: [1, 1.15, 1], backgroundColor: "#10B981", borderColor: "#10B981" }
                    : error
                      ? { backgroundColor: "transparent", borderColor: "#EF4444" }
                      : { backgroundColor: "#1E293B", borderColor: "#334155" }
                }
                transition={{ duration: 0.15 }}
                className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center"
              >
                {i < pin.length && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 rounded-full bg-white"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-400 text-[13px] mb-4"
              >
                PIN incorreto. Tente novamente.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {NUMPAD_KEYS.flat().map((key, idx) => {
              if (key === "") {
                return <div key={`empty-${idx}`} />;
              }
              const isDel = key === "del";
              return (
                <motion.button
                  key={key + idx}
                  whileTap={{ scale: 0.88, backgroundColor: "#334155" }}
                  onClick={() => handleNumpadPress(key)}
                  className={`h-[68px] rounded-2xl flex items-center justify-center text-xl font-semibold transition-colors ${
                    isDel
                      ? "bg-transparent text-[#94A3B8] active:bg-[#1E293B]"
                      : "bg-[#1E293B]/80 backdrop-blur-sm border border-[#334155]/50 text-[#F1F5F9] hover:bg-[#252F42] active:bg-[#334155]"
                  }`}
                >
                  {isDel ? <Delete size={22} /> : key}
                </motion.button>
              );
            })}
          </div>

          {/* Hint toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-[12px] text-[#64748B] hover:text-emerald-500 transition-colors"
            >
              Esqueceu o PIN?
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[12px] text-[#64748B] mt-1"
                >
                  PIN padrao: 1234
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pb-8 text-center"
      >
        <p className="text-[11px] text-[#475569]">PontoCerto v1.0</p>
      </motion.div>
    </div>
  );
}
