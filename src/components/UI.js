// src/components/UI.js
import React from "react";
import { Loader2 } from "lucide-react";

export const Button = ({ children, onClick, variant = "primary", size = "md", disabled, loading, className = "", type = "button" }) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200",
    secondary: "bg-white hover:bg-green-50 text-green-700 border-2 border-green-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200",
    ghost: "bg-transparent hover:bg-green-50 text-green-700",
    orange: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200",
  };
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg w-full",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = ({ label, error, className = "", ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input
      className={`w-full px-4 py-3 rounded-xl border-2 text-base outline-none transition-all
        ${error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-green-400 bg-white"}
        ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const Select = ({ label, error, options = [], className = "", ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select
      className={`w-full px-4 py-3 rounded-xl border-2 text-base outline-none transition-all appearance-none bg-white
        ${error ? "border-red-400" : "border-gray-200 focus:border-green-400"}
        ${className}`}
      {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const Card = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, color = "green" }) => {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
};

export const Spinner = ({ size = "md" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizes[size]} animate-spin text-green-600`} />
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-green-50">
    <div className="text-center">
      <div className="text-5xl mb-4">🌾</div>
      <Spinner size="lg" />
      <p className="mt-3 text-green-700 font-medium">Loading FarmLink...</p>
    </div>
  </div>
);

export const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="text-5xl mb-4">{icon || "📭"}</div>
    <h3 className="text-lg font-bold text-gray-700">{title}</h3>
    {subtitle && <p className="text-gray-500 text-sm mt-1 max-w-xs">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    pending: { label: "Pending / लंबित", color: "yellow" },
    accepted: { label: "Accepted / स्वीकृत", color: "green" },
    completed: { label: "Completed / पूर्ण", color: "blue" },
    rejected: { label: "Rejected / अस्वीकृत", color: "red" },
  };
  const s = map[status] || { label: status, color: "gray" };
  return <Badge color={s.color}>{s.label}</Badge>;
};
