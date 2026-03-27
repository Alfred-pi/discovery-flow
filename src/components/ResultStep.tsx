import { useState, useEffect, useCallback } from 'react';
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

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function AnimatedPrice({ value, currency }: { value: number; currency: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.round(Math.min(increment * step, value));
      setDisplay(current);
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatPrice(display, currency)}</span>;
}

const PARTICLE_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
];

function Particles() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 120 + Math.random() * 180;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const size = 4 + Math.random() * 8;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];

    return (
      <motion.div
        key={i}
        className="particle"
        style={{
          width: size,
          height: size,
          background: color,
          left: '50%',
          top: '40%',
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        }}
        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        animate={{
          opacity: [1, 1, 0],
          x: [0, x * 0.6, x],
          y: [0, y * 0.6 - 20, y + 40],
          scale: [1, 1.2, 0],
        }}
        transition={{
          duration: 1.2 + Math.random() * 0.6,
          delay: Math.random() * 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      />
    );
  });

  return <div className="particles-container">{particles}</div>;
}

export default function ResultStep({ price, currency, label, disclaimer, submitted, onSubmit }: Props) {
  const [showParticles, setShowParticles] = useState(true);

  const range = {
    low: Math.round(price * 0.85),
    high: Math.round(price * 1.15),
  };

  const hideParticles = useCallback(() => {
    setShowParticles(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(hideParticles, 2500);
    return () => clearTimeout(timer);
  }, [hideParticles]);

  return (
    <>
      {showParticles && <Particles />}
      <motion.div
        className="step result-step"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* No icon — clean minimal */}

        <motion.h1
          className="question-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {label}
        </motion.h1>

        <motion.div
          className="price-display"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <span className="price-range">
            {formatPrice(range.low, currency)} – {formatPrice(range.high, currency)}
          </span>
        </motion.div>

        <motion.div
          className="price-breakdown"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="price-center">
            <span className="price-label">Estimation centrale</span>
            <span className="price-main">
              <AnimatedPrice value={price} currency={currency} />
            </span>
          </div>
        </motion.div>

        <motion.p
          className="disclaimer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          {disclaimer}
        </motion.p>

        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.button
              className="cta-btn submit-btn"
              onClick={onSubmit}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Recevoir mon devis détaillé →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="success-message"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="success-icon"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
            >
              ✅
            </motion.div>
            <h2>Merci !</h2>
            <p>Vous recevrez votre devis personnalisé sous 24h.</p>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
