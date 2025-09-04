"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This code will only run on the client side after hydration
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

    // Apply theme to html element
    const htmlElement = document.documentElement;

    // Remove any existing theme classes first
    htmlElement.classList.remove("dark", "light");

    // Apply the correct theme class
    if (initialTheme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.add("light");
    }

    // Update the data attribute for consistency
    htmlElement.setAttribute('data-theme', initialTheme);

    // Apply background styling to body since we removed it from layout
    document.body.classList.add('bg-white', 'dark:bg-gray-900');

    setTheme(initialTheme);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("theme", theme);

      // Apply theme to html element
      const htmlElement = document.documentElement;

      // Remove any existing theme classes first
      htmlElement.classList.remove("dark", "light");

      // Apply the correct theme class
      if (theme === "dark") {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.add("light");
      }

      // Update the data attribute for consistency
      htmlElement.setAttribute('data-theme', theme);

      // Background styling is handled by the classes added during initialization
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Prevent flash of unstyled content by hiding content until mounted
  if (!isMounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          {children}
        </ThemeContext.Provider>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
