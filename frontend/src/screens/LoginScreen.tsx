/**
 * Login Screen - PontoCerto
 *
 * Login e Cadastro com usuario, senha e nome
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useAppState, useAuthMutations } from "@/context/AppContext";

export default function LoginScreen() {
  const { dispatch } = useAppState();
  const { login, register } = useAuthMutations();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError("Preencha usuario e senha");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await login.mutateAsync({ username: username.trim(), password });
      dispatch({ type: "SET_AUTH", payload: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim() || !regPassword || !regName.trim()) {
      setError("Preencha usuario, senha e nome");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }
    if (regPassword.length < 6) {
      setError("A senha deve ter no minimo 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await register.mutateAsync({
        username: regUsername.trim(),
        password: regPassword,
        name: regName.trim(),
      });
      // Auto login after register
      await login.mutateAsync({ username: regUsername.trim(), password: regPassword });
      dispatch({ type: "SET_AUTH", payload: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="flex flex-col h-full bg-app relative overflow-hidden">
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
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <img src="/assets/logo-pontocerto.jpg" alt="Ponto Certo" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[28px] font-bold text-app tracking-tight"
          >
            Ponto<span className="text-emerald-500">Certo</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] text-app-secondary mt-1 tracking-wide"
          >
            Seu controle de ponto, simples assim
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[320px]"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            {isSubmitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Shield size={18} className="text-emerald-500" />
              </motion.div>
            ) : mode === "login" ? (
              <LogIn size={18} className="text-emerald-500" />
            ) : (
              <UserPlus size={18} className="text-emerald-500" />
            )}
            <span className="text-[14px] text-app-secondary">
              {isSubmitting ? "Processando..." : mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input
                      type="text"
                      placeholder="Usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-12 bg-app-card border border-app rounded-xl pl-10 pr-4 text-app text-[15px] placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="w-full h-12 bg-app-card border border-app rounded-xl pl-10 pr-10 text-app text-[15px] placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLogin}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-white font-semibold text-[15px] transition-colors"
                >
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Usuario"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full h-11 bg-app-card border border-app rounded-xl px-4 text-app text-[14px] placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha (min 6 caracteres)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full h-11 bg-app-card border border-app rounded-xl px-4 pr-10 text-app text-[14px] placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full h-11 bg-app-card border border-app rounded-xl px-4 text-app text-[14px] placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full h-11 bg-app-card border border-app rounded-xl px-4 text-app text-[14px] placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={handleRegister}
                  disabled={isSubmitting}
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-white font-semibold text-[14px] transition-colors"
                >
                  {isSubmitting ? "Criando..." : "Criar conta"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-400 text-[12px] mt-4 px-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <button
              onClick={switchMode}
              className="text-[13px] text-app-muted hover:text-emerald-500 transition-colors"
            >
              {mode === "login" ? "Nao tem conta? Cadastre-se" : "Ja tem conta? Entrar"}
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="pb-6 text-center">
        <p className="text-[10px] text-app-muted">PontoCerto v1.0</p>
      </motion.div>
    </div>
  );
}
