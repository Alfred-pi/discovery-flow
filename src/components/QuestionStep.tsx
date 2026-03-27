import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.05, delayChildren: 0.12 },
  },
};

const optionVariant = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
};

const optionTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

interface Props {
  question: any;
  answer: string | string[] | undefined;
  onAnswer: (id: string, value: string | string[]) => void;
  onNext: () => void;
  direction: number;
}

export default function QuestionStep({ question, answer, onAnswer, onNext, direction }: Props) {
  const [localMulti, setLocalMulti] = useState<string[]>((answer as string[]) || []);
  const [contactData, setContactData] = useState<Record<string, string>>(
    typeof answer === 'string' ? {} : {}
  );

  useEffect(() => {
    if (question.type === 'multi-choice' && Array.isArray(answer)) {
      setLocalMulti(answer as string[]);
    }
  }, [question.id, answer]);

  const handleSingleChoice = (value: string) => {
    onAnswer(question.id, value);
    setTimeout(onNext, 250);
  };

  const handleMultiToggle = (value: string) => {
    const updated = localMulti.includes(value)
      ? localMulti.filter(v => v !== value)
      : [...localMulti, value];
    setLocalMulti(updated);
    onAnswer(question.id, updated);
  };

  const handleContactChange = (field: string, value: string) => {
    const updated = { ...contactData, [field]: value };
    setContactData(updated);
    onAnswer(question.id, JSON.stringify(updated));
  };

  const isContactValid = () => {
    if (question.type !== 'contact') return true;
    const fields = question.fields || ['name', 'email'];
    return fields.every((f: string) => contactData[f]?.trim());
  };

  // Handle Enter key for single-choice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (question.type === 'single-choice' && question.options) {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < question.options.length) {
          handleSingleChoice(question.options[idx].value);
        }
      }
      if (question.type === 'intro' && e.key === 'Enter') {
        onNext();
      }
      if (question.type === 'multi-choice' && e.key === 'Enter' && localMulti.length > 0) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, localMulti]);

  return (
    <motion.div
      className="step"
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h1
        className="question-title"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        {question.title}
      </motion.h1>

      {question.subtitle && (
        <motion.p
          className="question-subtitle"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {question.type === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.button
            className="cta-btn"
            onClick={onNext}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {question.buttonText || 'Commencer →'}
          </motion.button>
          <div className="keyboard-hint">
            <span>Appuyez sur</span>
            <kbd>Entrée</kbd>
            <span>↵</span>
          </div>
        </motion.div>
      )}

      {question.type === 'single-choice' && (
        <motion.div
          className="options"
          variants={staggerContainer}
          initial="enter"
          animate="center"
        >
          {question.options.map((opt: any, i: number) => (
              <motion.button
                key={opt.value}
                className={`option-btn ${answer === opt.value ? 'selected' : ''}`}
                onClick={() => handleSingleChoice(opt.value)}
                variants={optionVariant}
                transition={optionTransition}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="option-label">{opt.label}</span>
                <kbd style={{
                  minWidth: 20, height: 20, padding: '0 6px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 4, fontSize: 11, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-tertiary)', boxShadow: '0 1px 0 var(--border)',
                  fontFamily: 'inherit', flexShrink: 0
                }}>{i + 1}</kbd>
              </motion.button>
          ))}
        </motion.div>
      )}

      {question.type === 'multi-choice' && (
        <>
          <motion.div
            className="options"
            variants={staggerContainer}
            initial="enter"
            animate="center"
          >
            {question.options.map((opt: any) => (
                <motion.button
                  key={opt.value}
                  className={`option-btn ${localMulti.includes(opt.value) ? 'selected' : ''}`}
                  onClick={() => handleMultiToggle(opt.value)}
                  variants={optionVariant}
                  transition={optionTransition}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="option-label">{opt.label}</span>
                  {localMulti.includes(opt.value) && (
                    <motion.span
                      className="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              className="cta-btn"
              onClick={onNext}
              disabled={localMulti.length === 0}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Continuer →
            </motion.button>
          </motion.div>
        </>
      )}

      {question.type === 'contact' && (
        <motion.div
          className="contact-form"
          initial="enter"
          animate="center"
          variants={staggerContainer}
        >
          {(question.fields || ['name', 'email']).map((field: string, i: number) => (
            <motion.input
              key={field}
              type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
              placeholder={
                field === 'name' ? 'Votre nom'
                : field === 'email' ? 'votre@email.com'
                : field === 'phone' ? '+41 79 000 00 00 (optionnel)'
                : field
              }
              value={contactData[field] || ''}
              onChange={e => handleContactChange(field, e.target.value)}
              className="input-field"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              className="cta-btn"
              onClick={onNext}
              disabled={!isContactValid()}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Voir mon estimation →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
