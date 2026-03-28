import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Send, Loader2, AlertCircle } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(false);

    const submitCode = code || sessionStorage.getItem('discovery_code') || '';
    const client = sessionStorage.getItem('discovery_client') || '';

    try {
      await submitForm({
        answers,
        language,
        code: submitCode,
        client,
      });
      
      setSuccess(true);
      sessionStorage.removeItem('discovery_code');
      sessionStorage.removeItem('discovery_client');
    } catch (e) {
      console.error('Submission error:', e);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

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
      {success ? (
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
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <h1 className="result-title">{t.result.title}</h1>
            <p className="result-message">{t.result.message}</p>
          </motion.div>

          {error && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={20} />
              <span>{t.result.error}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              className="cta-btn"
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02, y: submitting ? 0 : -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  {language === 'fr' ? 'Envoi...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t.result.button}
                </>
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
