import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <motion.button
      className="theme-toggle"
      onClick={toggle}
      whileTap={{ scale: 0.85, rotate: -15 }}
      aria-label={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      <motion.span
        key={theme}
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, rotate: 90, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </motion.span>
    </motion.button>
  );
}
