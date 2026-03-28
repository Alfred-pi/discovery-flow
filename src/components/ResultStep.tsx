import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { submitForm } from '../lib/formsubmit';

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

interface Props {
  answers: any;
  onSubmit: () => Promise<void>;
  submitted: boolean;
  direction: number;
  t: any;
  language: 'fr' | 'en';
  token?: string;
  code?: string;
}

export default function ResultStep({ answers, direction, t, language, code }: Props) {
  const [status, setStatus] = useState<'sending' | 'success' | 'error'>('sending');

  const send = async () => {
    setStatus('sending');
    const submitCode = code || sessionStorage.getItem('discovery_code') || '';
    const client = sessionStorage.getItem('discovery_client') || '';

    try {
      await submitForm({
        answers,
        language,
        code: submitCode,
        client,
      });
      setStatus('success');
      sessionStorage.removeItem('discovery_code');
      sessionStorage.removeItem('discovery_client');
    } catch (e) {
      console.error('Submission error:', e);
      setStatus('error');
    }
  };

  useEffect(() => {
    send();
  }, []);

  return (
    <motion.div
      className="step result-step"
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {status === 'sending' && (
        <motion.div
          className="success-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="sending-dots">
            <span /><span /><span />
          </div>
          <h1 className="result-title">
            {language === 'fr' ? 'Envoi en cours...' : 'Sending...'}
          </h1>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div
          className="success-message"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <CheckCircle2 size={64} className="success-icon" />
          <h1 className="result-title">{t.result.sent}</h1>
          <p className="result-message">{t.result.sentMessage}</p>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          className="success-message"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <AlertCircle size={64} style={{ color: 'var(--error)', marginBottom: '24px' }} />
          <h1 className="result-title">{t.result.error}</h1>
          <motion.button
            className="cta-btn"
            onClick={send}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{ marginTop: '24px' }}
          >
            <RotateCcw size={18} />
            {language === 'fr' ? 'Réessayer' : 'Retry'}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
