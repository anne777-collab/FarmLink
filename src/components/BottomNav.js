// src/components/BottomNav.js
import React from "react";
import { Home, Search, Briefcase, User, Bell } from "lucide-react";

const tabs = {
  farmer: [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search / खोजें", icon: Search },
    { id: "jobs", label: "Requests", icon: Briefcase },
    { id: "profile", label: "Profile", icon: User },
  ],
  worker: [
    { id: "home", label: "Home", icon: Home },
    { id: "requests", label: "Requests", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ],
};

export default function BottomNav({ role, active, onChange }) {
  const navTabs = tabs[role] || tabs.farmer;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 px-1 transition-colors duration-200
                ${isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}>
              <Icon className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
              <span className={`text-xs mt-1 ${isActive ? "font-bold" : "font-normal"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-10 h-1 bg-green-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
