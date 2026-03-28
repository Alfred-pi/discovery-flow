import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.PROD 
  ? 'https://alfred.taild0005a.ts.net:8443' 
  : 'http://localhost:3001';

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
      const res = await fetch(`${API_URL}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('discovery_access', 'granted');
        sessionStorage.setItem('discovery_token', data.token);
        sessionStorage.setItem('discovery_code', code.trim().toUpperCase());
        sessionStorage.setItem('discovery_client', data.client || '');
        onUnlock(data.token, code.trim().toUpperCase(), data.client || '');
      } else {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    } catch (err) {
      console.error('Verify error:', err);
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
