import { useState, useEffect } from 'react';

// Custom hook for dark mode that persists to localStorage
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      // Check localStorage first
      const saved = localStorage.getItem('medilink-dark-mode');
      if (saved !== null) {
        return saved === 'true';
      }
      // Default to system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (e) {
      console.warn('Dark mode init error:', e);
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('medilink-dark-mode', dark.toString());
      // Apply to body for global styling
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = dark ? '#0f172a' : '#f1f5f9';
      }
    } catch (e) {
      console.warn('Dark mode save error:', e);
    }
  }, [dark]);

  return [dark, setDark];
}

export default useDarkMode;
