import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cheran_website_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("cheran_website_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ta" : "en"));
  };

  const isTamil = lang === "ta";

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, isTamil }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
