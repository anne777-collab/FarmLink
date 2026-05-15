import React, { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("khetmitra_install_dismissed") === "true";
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("khetmitra_install_dismissed", "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && installEvent && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-3xl border border-emerald-200 bg-white/95 p-4 shadow-2xl shadow-emerald-900/10 backdrop-blur dark:border-emerald-900/40 dark:bg-slate-950/95"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">Install KhetMitra App</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Add FarmLink to your phone for faster loading, app-like navigation, and offline basic screens.
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={handleInstall} className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white">
                  <Download className="h-4 w-4" />
                  Install
                </button>
                <button onClick={handleDismiss} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  Later
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
