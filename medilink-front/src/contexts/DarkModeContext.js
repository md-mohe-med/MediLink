import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('medilink-dark-mode');
      if (saved !== null) {
        return saved === 'true';
      }
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
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = dark ? '#0f172a' : '#f1f5f9';
      }
    } catch (e) {
      console.warn('Dark mode save error:', e);
    }
  }, [dark]);

  // Listen for storage events to sync across tabs/pages
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'medilink-dark-mode') {
        setDark(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleDark = () => setDark(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ dark, setDark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return [context.dark, context.setDark, context.toggleDark];
}

export default useDarkMode;
