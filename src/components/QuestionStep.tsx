import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import VoiceRecorder from './VoiceRecorder';

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
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
  answer: any;
  onAnswer: (id: string, value: any) => void;
  onNext: () => void;
  direction: number;
  t: any;
  language: 'fr' | 'en';
}

export default function QuestionStep({ question, answer, onAnswer, onNext, direction, language }: Props) {
  const currentValue: string[] = answer?.value || answer || [];
  const currentDetails: string = answer?.details || '';
  const [localMulti, setLocalMulti] = useState<string[]>(
    Array.isArray(currentValue) ? currentValue : []
  );
  const [details, setDetails] = useState(currentDetails);
  const [contactData, setContactData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Array.isArray(currentValue)) {
      setLocalMulti(currentValue);
    }
    setDetails(currentDetails);
  }, [question.id]);

  const handleToggle = (value: string) => {
    const updated = localMulti.includes(value)
      ? localMulti.filter(v => v !== value)
      : [...localMulti, value];
    setLocalMulti(updated);
    onAnswer(question.id, { value: updated, details });
  };

  const handleDetailsChange = (text: string) => {
    setDetails(text);
    onAnswer(question.id, { value: localMulti, details: text });
  };

  const handleContactChange = (field: string, value: string) => {
    const updated = { ...contactData, [field]: value };
    setContactData(updated);
    onAnswer(question.id, JSON.stringify(updated));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    // Allow +, digits, spaces, dashes, parens — min 8 chars
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?\d{8,15}$/.test(cleaned);
  };

  const getFieldError = (field: string): string | null => {
    const val = contactData[field]?.trim();
    if (!val) return null; // Don't show error on empty (just disable button)
    if (field === 'email' && !validateEmail(val)) return language === 'fr' ? 'Email invalide' : 'Invalid email';
    if (field === 'phone' && val && !validatePhone(val)) return language === 'fr' ? 'Numéro invalide' : 'Invalid number';
    return null;
  };

  const isContactValid = () => {
    if (question.type !== 'contact') return true;
    const name = contactData['name']?.trim();
    const email = contactData['email']?.trim();
    const phone = contactData['phone']?.trim();
    if (!name || !email) return false;
    if (!validateEmail(email)) return false;
    if (phone && !validatePhone(phone)) return false;
    return true;
  };

  const canContinue = localMulti.length > 0 || details.trim().length > 0;

  // Keyboard: Enter to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (question.type === 'intro') {
          onNext();
        } else if (question.type === 'multi-choice' && canContinue) {
          // Don't trigger if typing in textarea
          if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, canContinue]);

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
                onClick={() => handleToggle(opt.value)}
                variants={optionVariant}
                transition={optionTransition}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {opt.icon && <span className="option-icon"><Icon name={opt.icon} size={20} /></span>}
                <span className="option-label">{opt.label}</span>
                <AnimatePresence>
                  {localMulti.includes(opt.value) && (
                    <motion.span
                      className="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>

          {/* Details textarea + voice */}
          <motion.div
            className="details-field"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <div className="details-row">
              <textarea
                className="input-field details-textarea"
                placeholder={question.detailsPlaceholder || 'Précisez si besoin...'}
                value={details}
                onChange={e => handleDetailsChange(e.target.value)}
                rows={2}
              />
              <VoiceRecorder
                onTranscription={(text) => {
                  const updated = details ? `${details} ${text}` : text;
                  handleDetailsChange(updated);
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="step-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              className="cta-btn"
              onClick={onNext}
              disabled={!canContinue}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Continuer →
            </motion.button>
            <div className="keyboard-hint">
              <span>Appuyez sur</span>
              <kbd>Entrée</kbd>
              <span>↵</span>
            </div>
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
          {(question.fields || ['name', 'email']).map((field: string, i: number) => {
            const error = getFieldError(field);
            return (
              <motion.div
                key={field}
                className="field-wrapper"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
              >
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  placeholder={question.placeholders?.[field] || field}
                  value={contactData[field] || ''}
                  onChange={e => handleContactChange(field, e.target.value)}
                  className={`input-field ${error ? 'input-error' : ''}`}
                  inputMode={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                />
                {error && <span className="field-error">{error}</span>}
              </motion.div>
            );
          })}
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
              {language === 'fr' ? 'Continuer →' : 'Continue →'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {question.type === 'comments' && (
        <>
          <motion.div
            className="comments-field"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <textarea
              className="input-field details-textarea comments-textarea"
              placeholder={question.placeholder || ''}
              value={details}
              onChange={e => {
                setDetails(e.target.value);
                onAnswer(question.id, e.target.value);
              }}
              rows={5}
            />
          </motion.div>

          <motion.div
            className="step-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              className="cta-btn"
              onClick={onNext}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {question.buttonText || (language === 'fr' ? 'Envoyer ma demande' : 'Submit my request')}
            </motion.button>
            <p className="skip-hint" onClick={onNext} style={{ marginTop: '12px', color: 'var(--text-tertiary)', fontSize: '14px', cursor: 'pointer' }}>
              {language === 'fr' ? 'Passer cette étape' : 'Skip this step'}
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
