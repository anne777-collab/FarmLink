import React from "react";
import { cn } from "../utils/cn";

export interface ProfileAvatarProps {
  name: string;
  role: "farmer" | "worker";
  src?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-10 w-10 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-20 w-20 text-lg",
  xl: "h-24 w-24 text-xl",
};

const roleMap = {
  worker: "from-emerald-500 to-lime-500",
  farmer: "from-amber-500 to-orange-500",
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  role,
  src,
  className,
  size = "md",
}) => {
  const initials = getInitials(name);
  const sizeClass = sizeMap[size];
  const gradientClass = roleMap[role];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-white/80 dark:ring-slate-900/80", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br font-black text-white shadow-sm ring-2 ring-white/80 dark:ring-slate-900/80",
        gradientClass,
        sizeClass,
        className
      )}
      aria-label={`${name} avatar`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default ProfileAvatar;
