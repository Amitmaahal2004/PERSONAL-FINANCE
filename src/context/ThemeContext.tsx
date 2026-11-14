'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hexToRgb, adjustColorBrightness } from '@/lib/theme';
export { hexToRgb, adjustColorBrightness };

export interface IGlobalTheme {
  primaryColor: string;
  secondaryColor: string;
  updatedAt?: string;
}

interface ThemeContextType {
  theme: IGlobalTheme;
  previewTheme: IGlobalTheme;
  setPreviewTheme: (theme: Partial<IGlobalTheme>) => void;
  applyPreview: () => void;
  saveTheme: (newTheme?: Partial<IGlobalTheme>) => Promise<{ success: boolean; error?: string }>;
  resetTheme: () => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

const DEFAULT_THEME: IGlobalTheme = {
  primaryColor: '#10B981',
  secondaryColor: '#0F766E',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  previewTheme: DEFAULT_THEME,
  setPreviewTheme: () => {},
  applyPreview: () => {},
  saveTheme: async () => ({ success: false }),
  resetTheme: async () => ({ success: false }),
  isLoading: true,
});

export function applyCssCustomProperties(primary: string, secondary: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const pRgb = hexToRgb(primary);
  const sRgb = hexToRgb(secondary);

  // Primary colors
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-rgb', `${pRgb.r}, ${pRgb.g}, ${pRgb.b}`);
  root.style.setProperty('--color-primary-hover', adjustColorBrightness(primary, -12));
  root.style.setProperty('--color-primary-active', adjustColorBrightness(primary, -20));
  root.style.setProperty('--color-primary-light', `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.08)`);
  root.style.setProperty('--color-primary-subtle', `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.15)`);
  root.style.setProperty('--color-primary-border', `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.3)`);
  root.style.setProperty('--color-primary-ring', `rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.25)`);

  // Secondary colors
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-secondary-rgb', `${sRgb.r}, ${sRgb.g}, ${sRgb.b}`);
  root.style.setProperty('--color-secondary-hover', adjustColorBrightness(secondary, -12));
  root.style.setProperty('--color-secondary-active', adjustColorBrightness(secondary, -20));
  root.style.setProperty('--color-secondary-light', `rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.08)`);
  root.style.setProperty('--color-secondary-border', `rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.3)`);
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: IGlobalTheme;
}) {
  const [theme, setThemeState] = useState<IGlobalTheme>(initialTheme || DEFAULT_THEME);
  const [previewTheme, setPreviewThemeState] = useState<IGlobalTheme>(initialTheme || DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Apply colors to root CSS properties immediately
  useEffect(() => {
    applyCssCustomProperties(theme.primaryColor, theme.secondaryColor);
  }, [theme]);

  // Fetch persisted theme from server on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch('/api/theme');
        if (res.ok) {
          const data = await res.json();
          if (data.theme) {
            setThemeState(data.theme);
            setPreviewThemeState(data.theme);
            applyCssCustomProperties(data.theme.primaryColor, data.theme.secondaryColor);
          }
        }
      } catch (err) {
        console.error('Failed to load global theme:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, []);

  const setPreviewTheme = (updates: Partial<IGlobalTheme>) => {
    setPreviewThemeState((prev) => ({ ...prev, ...updates }));
  };

  const applyPreview = () => {
    applyCssCustomProperties(previewTheme.primaryColor, previewTheme.secondaryColor);
  };

  const saveTheme = async (newTheme?: Partial<IGlobalTheme>) => {
    const themeToSave = {
      primaryColor: newTheme?.primaryColor || previewTheme.primaryColor,
      secondaryColor: newTheme?.secondaryColor || previewTheme.secondaryColor,
    };

    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeToSave),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to save theme' };
      }

      setThemeState(data.theme);
      setPreviewThemeState(data.theme);
      applyCssCustomProperties(data.theme.primaryColor, data.theme.secondaryColor);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving theme' };
    }
  };

  const resetTheme = async () => {
    try {
      const res = await fetch('/api/admin/theme/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to reset theme' };
      }

      setThemeState(data.theme);
      setPreviewThemeState(data.theme);
      applyCssCustomProperties(data.theme.primaryColor, data.theme.secondaryColor);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error resetting theme' };
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        previewTheme,
        setPreviewTheme,
        applyPreview,
        saveTheme,
        resetTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useGlobalTheme() {
  return useContext(ThemeContext);
}

