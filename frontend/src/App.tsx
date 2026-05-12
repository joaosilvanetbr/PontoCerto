import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Shield } from "lucide-react";
import { AppProvider, useAppState } from "@/context/AppContext";
import Toast from "@/components/Toast";
import BottomNav from "@/components/BottomNav";
import LoginScreen from "@/screens/LoginScreen";
import HomeScreen from "@/screens/HomeScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import ProfileScreen from "@/screens/ProfileScreen";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1 overflow-hidden"
      >
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { state } = useAppState();

  if (state.session.sessionLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-app">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Shield size={48} className="text-emerald-500" />
        </motion.div>
        <p className="text-app-secondary text-sm mt-4">Verificando sessao...</p>
      </div>
    );
  }

  if (!state.session.isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="h-full flex flex-col">
      <AnimatedRoutes />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-black flex justify-center items-start">
        <div className="w-full max-w-[430px] h-[100dvh] bg-app relative overflow-hidden shadow-2xl">
          <AppContent />
          <Toast />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
