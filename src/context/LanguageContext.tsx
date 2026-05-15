import React, { createContext, useContext, useState } from "react";
import { Language, translations } from "../utils/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations["en"]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("farmlink-lang");
    if (stored === "en" || stored === "hi") return stored as Language;
    return "en"; // Default is English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("farmlink-lang", lang);
  };

  const t = (key: keyof typeof translations["en"]): string => {
    const dict = translations[language] || translations["en"];
    return dict[key] || translations["en"][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
