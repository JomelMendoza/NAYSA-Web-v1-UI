import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query"; // Import TanStack Query
import { useAuth } from "../Authentication/AuthContext.jsx";
import { fetchData } from "../Configuration/BaseURL.jsx"; // Assuming your fetch utility
import { LoadingSpinner } from "../Global/utilities.jsx";

export default function Dashboard1({ user: propUser }) {
  const { user: ctxUser } = useAuth();
  
  // Refactoring to TanStack Query for User Profile/Stats
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', ctxUser?.USER_CODE],
    queryFn: () => fetchData("user-profile", { USER_CODE: ctxUser?.USER_CODE }),
    enabled: !!ctxUser?.USER_CODE, // Only run if user is logged in
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const user = useMemo(() => propUser ?? ctxUser ?? userProfile ?? null, [propUser, ctxUser, userProfile]);
  const name = user?.USER_NAME || user?.USER_CODE || "User";
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  // Professional Loading State
if (isLoading) return <LoadingSpinner />;

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20">
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80"
          >
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">New: Quick Search</h4>
            <p className="text-sm text-slate-500 mb-4">Press <kbd className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs font-mono">Ctrl + K</kbd> to jump between modules.</p>
            <button onClick={dismissOnboarding} className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">Got it</button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="w-full max-w-2xl"
      >
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-14 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="mb-12">
            <p className="text-[12px] font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 uppercase mb-7">NAYSA Financials Cloud</p>
            <h1 className="text-[40px] font-light text-slate-900 dark:text-white tracking-tight">
              Hello, <span className="text-[42px] font-bold text-slate-900 dark:text-white">{name}</span>
            </h1>
          </div>

          <motion.img
            whileHover={{ scale: 1.05 }}
            src="/NAYSA.jpg"
            alt="NAYSA Financials"
            className="w-[250px] mb-[25px] select-none"
            draggable="false"
          />

          <div className="flex items-center gap-6 text-slate-400 dark:text-slate-600">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
              ID: {user?.USER_CODE}
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}