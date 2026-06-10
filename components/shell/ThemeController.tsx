'use client';
import { useEffect } from 'react';
import { useSettings } from '@/lib/state/settingsStore';

export function ThemeController() {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);
  return null;
}
