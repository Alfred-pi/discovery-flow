import { motion } from 'framer-motion';
import type { Answers } from '../App';

interface Props {
  price: number;
  currency: string;
  label: string;
  disclaimer: string;
  submitted: boolean;
  onSubmit: () => void;
  answers: Answers;
  direction: number;
}

const variants = {
  enter: { y: 40, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -40, opacity: 0 },
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ResultStep({ price, currency, label, disclaimer, submitted, onSubmit }: Props) {
  const range = {
    low: Math.round(price * 0.85),
    high: Math.round(price * 1.15),
  };

  return (
    <motion.div
      className="step result-step"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="result-icon">💎</div>
      <h1 className="question-title">{label}</h1>

      <div className="price-display">
        <span className="price-range">
          {formatPrice(range.low, currency)} – {formatPrice(range.high, currency)}
        </span>
      </div>

      <div className="price-breakdown">
        <div className="price-center">
          <span className="price-label">Estimation centrale</span>
          <span className="price-main">{formatPrice(price, currency)}</span>
        </div>
      </div>

      <p className="disclaimer">{disclaimer}</p>

      {!submitted ? (
        <button className="cta-btn submit-btn" onClick={onSubmit}>
          Recevoir mon devis détaillé →
        </button>
      ) : (
        <motion.div
          className="success-message"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="success-icon">✅</div>
          <h2>Merci !</h2>
          <p>Vous recevrez votre devis personnalisé sous 24h.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
