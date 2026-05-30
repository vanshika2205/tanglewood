"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const UIContext = createContext({
  uiMode: "classic",
  colorMode: "dark",
  setUiMode: () => {},
  setColorMode: () => {},
  toggleColorMode: () => {},
});

export const UIProvider = ({ children }) => {
  const [uiMode, setUiMode] = useState("classic");
  const [colorMode, setColorMode] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedUiMode = localStorage.getItem("samtulan-ui-mode");
    const savedColorMode = localStorage.getItem("samtulan-color-mode");
    
    if (savedUiMode) setUiMode(savedUiMode);
    if (savedColorMode) setColorMode(savedColorMode);
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("samtulan-ui-mode", uiMode);
      localStorage.setItem("samtulan-color-mode", colorMode);
      
      // Clear existing theme/mode classes
      document.body.classList.remove("theme-classic", "theme-modern", "theme-cyber", "theme-minimalist", "mode-dark", "mode-light");
      
      // Add new classes
      document.body.classList.add(`theme-${uiMode}`);
      document.body.classList.add(`mode-${colorMode}`);
    }
  }, [uiMode, colorMode, mounted]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <UIContext.Provider value={{ uiMode, colorMode, setUiMode, setColorMode, toggleColorMode }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
