"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Keep client components renderable during App Router's server pre-render pass.
// The root layout still supplies the live provider; this default is only a safe
// fallback when Next renders a client component before that context is attached.
const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const restoreFrame = window.requestAnimationFrame(() => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme !== "dark" && savedTheme !== "light") return;
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    });
    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
