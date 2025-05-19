import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Check local storage or system preference for initial theme
  const getInitialTheme = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPrefs = window.localStorage.getItem('theme');
      if (storedPrefs) {
        return storedPrefs;
      }

      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (userMedia.matches) {
        return 'dark';
      }
    }
    return 'light'; // Default theme
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Add or remove dark class on body
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
