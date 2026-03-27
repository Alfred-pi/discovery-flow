import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface Props {
  onUnlock: () => void;
  t: any;
}

const ACCESS_CODE = 'BLUE47';

export default function AccessGate({ onUnlock, t }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toUpperCase() === ACCESS_CODE) {
      sessionStorage.setItem('discovery_access', 'granted');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="access-gate">
      <motion.div
        className="access-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="access-icon">
          <Lock size={32} />
        </div>
        <h1 className="access-title">{t.access.title}</h1>
        <p className="access-subtitle">{t.access.subtitle}</p>
        
        <form onSubmit={handleSubmit} className="access-form">
          <input
            type="text"
            className={`input-field ${error ? 'input-error' : ''}`}
            placeholder={t.access.placeholder}
            value={code}
            onChange={e => setCode(e.target.value)}
            autoFocus
          />
          {error && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t.access.error}
            </motion.p>
          )}
          <motion.button
            type="submit"
            className="cta-btn"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.access.button}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
