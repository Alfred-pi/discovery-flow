import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ContactInfo } from '../types';

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.98 }),
};

const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fieldVariant = {
  enter: { opacity: 0, y: 16, scale: 0.95 },
  center: { opacity: 1, y: 0, scale: 1 },
};

const fieldTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
};

interface Props {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
  onNext: () => void;
  direction: number;
}

const FIELDS = [
  { key: 'name' as const, type: 'text', placeholder: 'Votre nom' },
  { key: 'email' as const, type: 'email', placeholder: 'votre@email.com' },
  { key: 'phone' as const, type: 'tel', placeholder: '+41 79 000 00 00' },
] as const;

export default function ContactStep({ contact, onChange, onNext, direction }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ContactInfo, value: string) => {
    onChange({ ...contact, [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!contact.name.trim()) errs.name = 'Requis';
    if (!contact.email.trim()) errs.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errs.email = 'Email invalide';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validate()) onNext();
  };

  return (
    <motion.div
      className="step"
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.h1
        className="question-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        Parfait ! Comment vous contacter ?
      </motion.h1>

      <motion.p
        className="question-subtitle"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Vous recevrez un devis détaillé sous 24h
      </motion.p>

      <motion.div
        className="contact-form"
        variants={staggerContainer}
        initial="enter"
        animate="center"
      >
        {FIELDS.map((f) => (
          <motion.div
            key={f.key}
            className="field-wrapper"
            variants={fieldVariant}
            transition={fieldTransition}
          >
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={contact[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className={`input-field ${errors[f.key] ? 'input-error' : ''}`}
            />
            {errors[f.key] && <span className="field-error">{errors[f.key]}</span>}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.button
            className="cta-btn"
            onClick={handleSubmit}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Voir le récapitulatif →
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
