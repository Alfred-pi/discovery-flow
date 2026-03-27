import { motion } from 'framer-motion';

interface Props {
  language: 'fr' | 'en';
  onToggle: () => void;
}

export default function LanguageToggle({ language, onToggle }: Props) {
  return (
    <motion.button
      className="lang-toggle"
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <span className={language === 'fr' ? 'active' : ''}>FR</span>
      <span className="separator">|</span>
      <span className={language === 'en' ? 'active' : ''}>EN</span>
    </motion.button>
  );
}
