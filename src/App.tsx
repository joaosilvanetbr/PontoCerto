/**
 * App Root - PontoCerto
 *
 * Session management:
 * - Auth state from localStorage token
 * - 30-min session timeout (handled by AppContext)
 * - Auto-logout on token expiry
 */
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
        <div className="w-full max-w-[430px] h-[100dvh] bg-[#0F172A] relative overflow-hidden shadow-2xl">
          <AppContent />
          <Toast />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
