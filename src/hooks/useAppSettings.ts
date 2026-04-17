import { useState, useCallback, createContext, useContext } from 'react';
import { type AppSettings, loadSettings, saveSettings } from '@/lib/settings';
import { type Locale } from '@/lib/i18n';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  locale: Locale;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsProvider() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, locale: settings.locale };
}

export function useAppSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within SettingsContext');
  return ctx;
}
