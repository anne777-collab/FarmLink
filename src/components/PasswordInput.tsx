import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your password",
  id,
  name,
  required = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Lock className="h-5 w-5 text-slate-400" />
      </div>
      
      <input
        type={showPassword ? "text" : "password"}
        required={required}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-12 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors duration-200"
      />

      <button
        type="button"
        onClick={toggleVisibility}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5 transition-transform hover:scale-105" />
        ) : (
          <Eye className="h-5 w-5 transition-transform hover:scale-105" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
