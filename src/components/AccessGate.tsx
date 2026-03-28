import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { verifyCode } from '../lib/codes';

interface Props {
  onUnlock: (token: string, code: string, client: string) => void;
  t: any;
}

export default function AccessGate({ onUnlock, t }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const result = await verifyCode(code.trim());
      
      if (result.valid) {
        sessionStorage.setItem('discovery_access', 'granted');
        sessionStorage.setItem('discovery_code', code.trim().toUpperCase());
        sessionStorage.setItem('discovery_client', result.client);
        onUnlock('', code.trim().toUpperCase(), result.client);
      } else {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
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
            disabled={loading}
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
            disabled={loading || !code.trim()}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : t.access.button}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
