"use client";
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const UIContext = createContext({
  uiMode: "classic",
  colorMode: "dark",
  setUiMode: () => {},
  setColorMode: () => {},
  toggleColorMode: () => {},
  captionsEnabled: true,
  setCaptionsEnabled: () => {},
  captionSize: "medium",
  setCaptionSize: () => {},
  autoPlay: true,
  setAutoPlay: () => {},
});

export const UIProvider = ({ children }) => {
  const [uiMode, setUiMode] = useState("classic");
  const [colorMode, setColorMode] = useState("dark");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionSize, setCaptionSize] = useState("medium");
  const [autoPlay, setAutoPlay] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedUiMode = localStorage.getItem("samtulan-ui-mode");
      const savedColorMode = localStorage.getItem("samtulan-color-mode");
      const savedCC = localStorage.getItem("samtulan-cc-enabled");
      const savedCCSize = localStorage.getItem("samtulan-cc-size");
      const savedAutoPlay = localStorage.getItem("samtulan-autoplay");
      
      if (savedUiMode) setUiMode(savedUiMode);
      if (savedColorMode) setColorMode(savedColorMode);
      if (savedCC !== null) setCaptionsEnabled(savedCC === "true");
      if (savedCCSize) setCaptionSize(savedCCSize);
      if (savedAutoPlay !== null) setAutoPlay(savedAutoPlay === "true");
    } catch (e) {
      console.error("Context initialization error:", e);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    try {
      localStorage.setItem("samtulan-ui-mode", uiMode);
      localStorage.setItem("samtulan-color-mode", colorMode);
      localStorage.setItem("samtulan-cc-enabled", String(captionsEnabled));
      localStorage.setItem("samtulan-cc-size", captionSize);
      localStorage.setItem("samtulan-autoplay", String(autoPlay));
      
      document.body.classList.remove("theme-classic", "theme-modern", "theme-cyber", "theme-minimalist", "mode-dark", "mode-light");
      document.body.classList.add(`theme-${uiMode}`);
      document.body.classList.add(`mode-${colorMode}`);
    } catch (e) {
      console.error("Context sync error:", e);
    }
  }, [uiMode, colorMode, captionsEnabled, captionSize, autoPlay, mounted]);

  const toggleColorMode = () => setColorMode(prev => prev === "dark" ? "light" : "dark");

  const value = useMemo(() => ({
    uiMode, colorMode, setUiMode, setColorMode, toggleColorMode,
    captionsEnabled, setCaptionsEnabled, captionSize, setCaptionSize, autoPlay, setAutoPlay
  }), [uiMode, colorMode, captionsEnabled, captionSize, autoPlay]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
