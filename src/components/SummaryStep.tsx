import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Answers, ContactInfo } from '../types';

interface Props {
  questions: {
    id: string;
    type: string;
    title: string;
    options?: { label: string; value: string }[];
  }[];
  answers: Answers;
  contact: ContactInfo;
  price: number;
  currency: string;
  disclaimer: string;
  onSubmit: () => void;
  submitted: boolean;
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
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(Math.min(increment * step, value)));
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatPrice(display, currency)}</span>;
}

function getAnswerLabel(
  question: Props['questions'][number],
  value: string | string[] | undefined
): string {
  if (!value) return '—';
  if (!question.options) return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => question.options!.find((o) => o.value === v)?.label || v)
      .join(', ');
  }
  return question.options.find((o) => o.value === value)?.label || String(value);
}

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function SummaryStep({
  questions,
  answers,
  contact,
  price,
  currency,
  disclaimer,
  onSubmit,
  submitted,
}: Props) {
  const range = {
    low: Math.round(price * 0.85),
    high: Math.round(price * 1.15),
  };

  return (
    <motion.div
      className="step"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.h1
        className="question-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Récapitulatif de votre brief
      </motion.h1>

      <div className="summary-cards">
        {questions.map((q, i) => {
          const entry = answers[q.id];
          if (!entry?.value && !entry?.details) return null;

          return (
            <motion.div
              key={q.id}
              className="summary-card"
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{
                delay: 0.15 + i * 0.07,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <h3 className="summary-card-title">{q.title}</h3>
              <p className="summary-card-value">
                {getAnswerLabel(q, entry.value)}
              </p>
              {entry.details && (
                <p className="summary-card-details">{entry.details}</p>
              )}
            </motion.div>
          );
        })}

        <motion.div
          className="summary-card"
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{
            delay: 0.15 + questions.length * 0.07,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          <h3 className="summary-card-title">Contact</h3>
          <p className="summary-card-value">{contact.name}</p>
          <p className="summary-card-details">
            {contact.email}
            {contact.phone ? ` — ${contact.phone}` : ''}
          </p>
        </motion.div>
      </div>

      <motion.div
        className="price-display"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.3 + questions.length * 0.07,
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
      >
        <span className="price-range">
          {formatPrice(range.low, currency)} – {formatPrice(range.high, currency)}
        </span>
      </motion.div>

      <motion.div
        className="price-breakdown"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + questions.length * 0.07, duration: 0.5 }}
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
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        {disclaimer}
      </motion.p>

      {!submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.button
            className="cta-btn submit-btn"
            onClick={onSubmit}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Envoyer mon brief →
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
  );
}
