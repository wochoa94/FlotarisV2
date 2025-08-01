// src/theme/index.ts
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { themes, ThemeName } from './colors';
import { logos, LogoName } from './logos';

interface ThemeContextType {
  themeName: ThemeName;
  logoUrl: string;
  // No setTheme here, as it's configured at build/deployment time
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme: ThemeName; // Theme is now passed as a required prop
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // The themeName is now directly derived from the initialTheme prop
  const themeName = initialTheme;

  useEffect(() => {
    const currentTheme = themes[themeName];
    if (currentTheme) {
      // Apply CSS variables to the root HTML element
      Object.entries(currentTheme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    } else {
      console.warn(`Theme "${themeName}" not found. Falling back to default.`);
      // Apply default theme if the specified initialTheme is not found
      const defaultTheme = themes.default;
      Object.entries(defaultTheme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [themeName]); // Re-apply theme if themeName changes (e.g., if parent re-renders with new initialTheme)

  const logoUrl = logos[themeName as LogoName] || logos.default;

  const value = {
    themeName,
    logoUrl,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}