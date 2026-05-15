import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300",
    error: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300",
    info: "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-300"
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    error: <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
    info: <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-bounce-short transition-all">
      <div className={`flex items-start space-x-3 rounded-xl p-1 ${styles[type]}`}>
        <div className="mt-0.5">{icons[type]}</div>
        <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
export default Toast;
