import React from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { JobStatus } from "../context/AppContext";

const steps: Array<{ status: JobStatus; label: string }> = [
  { status: "posted", label: "Posted" },
  { status: "applied", label: "Applied" },
  { status: "accepted", label: "Accepted" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "rated", label: "Rated" },
];

export const JobTimeline: React.FC<{ status: JobStatus; compact?: boolean }> = ({ status, compact = false }) => {
  const activeIndex = steps.findIndex(step => step.status === status);
  const cancelled = status === "cancelled";

  if (cancelled) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
        Job cancelled
      </div>
    );
  }

  return (
    <div className={`grid ${compact ? "grid-cols-3 gap-2 sm:grid-cols-6" : "grid-cols-2 gap-3 sm:grid-cols-6"}`}>
      {steps.map((step, index) => {
        const complete = index < activeIndex;
        const current = index === activeIndex;
        return (
          <motion.div
            key={step.status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.22 }}
            className={`relative rounded-2xl border p-3 text-center transition-all ${
              complete
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                : current
                  ? "border-amber-200 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                  : "border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/40"
            }`}
          >
            {current && (
              <motion.span
                layoutId="job-timeline-active"
                className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/60"
                animate={{ opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            )}
            <div className="relative mx-auto mb-1 flex h-6 w-6 items-center justify-center">
              {complete ? <CheckCircle className="h-5 w-5" /> : current ? <Clock className="h-5 w-5 animate-pulse" /> : <Circle className="h-5 w-5" />}
            </div>
            <span className="relative text-[10px] font-black uppercase tracking-wide">{step.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const JobStatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const label = status.replace("_", " ");
  const tone = status === "cancelled"
    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"
    : status === "completed" || status === "rated"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
      : status === "in_progress"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"
        : "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
};
