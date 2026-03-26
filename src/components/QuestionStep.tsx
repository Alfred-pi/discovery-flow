import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AnswerEntry } from '../types';
import VoiceRecorder from './VoiceRecorder';

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.98 }),
};

const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const optionVariant = {
  enter: { opacity: 0, y: 16, scale: 0.95 },
  center: { opacity: 1, y: 0, scale: 1 },
};

const optionTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
};

interface Props {
  question: {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    placeholder?: string;
    detailsPrompt?: string;
    options?: { label: string; value: string; priceWeight: number }[];
  };
  answer: AnswerEntry | undefined;
  onAnswer: (id: string, entry: AnswerEntry) => void;
  onNext: () => void;
  direction: number;
}

export default function QuestionStep({ question, answer, onAnswer, onNext, direction }: Props) {
  const [localMulti, setLocalMulti] = useState<string[]>(
    Array.isArray(answer?.value) ? (answer.value as string[]) : []
  );
  const [details, setDetails] = useState(answer?.details || '');

  const handleSingleChoice = (value: string) => {
    onAnswer(question.id, { value, details });
  };

  const handleMultiToggle = (value: string) => {
    const updated = localMulti.includes(value)
      ? localMulti.filter(v => v !== value)
      : [...localMulti, value];
    setLocalMulti(updated);
    onAnswer(question.id, { value: updated, details });
  };

  const handleDetailsChange = (text: string) => {
    setDetails(text);
    const currentValue = question.type === 'multi-choice'
      ? localMulti
      : answer?.value;
    onAnswer(question.id, { value: currentValue, details: text });
  };

  const handleTranscription = (text: string) => {
    const newDetails = details ? `${details} ${text}` : text;
    handleDetailsChange(newDetails);
  };

  const canContinue = () => {
    if (question.type === 'open') return !!details.trim();
    if (question.type === 'multi-choice') return localMulti.length > 0;
    return !!answer?.value;
  };

  const isOpen = question.type === 'open';
  const hasOptions = question.type === 'single-choice' || question.type === 'multi-choice';

  return (
    <motion.div
      className="step"
      custom={direction}
      variants={{ ...pageVariants, ...staggerContainer }}
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
        {question.title}
      </motion.h1>

      {question.subtitle && (
        <motion.p
          className="question-subtitle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {hasOptions && (
        <motion.div
          className="options"
          variants={staggerContainer}
          initial="enter"
          animate="center"
        >
          {question.options!.map((opt) => {
            const isSelected = question.type === 'multi-choice'
              ? localMulti.includes(opt.value)
              : answer?.value === opt.value;

            return (
              <motion.button
                key={opt.value}
                className={`option-btn ${isSelected ? 'selected' : ''}`}
                onClick={() =>
                  question.type === 'single-choice'
                    ? handleSingleChoice(opt.value)
                    : handleMultiToggle(opt.value)
                }
                variants={optionVariant}
                transition={optionTransition}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {opt.label}
                {isSelected && question.type === 'multi-choice' && (
                  <motion.span
                    className="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <motion.div
        className="details-area"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: hasOptions ? 0.3 : 0.15, duration: 0.3 }}
      >
        <textarea
          className="details-textarea"
          placeholder={
            isOpen
              ? (question.placeholder || 'Parlez librement...')
              : (question.detailsPrompt || 'Ajoutez des détails...')
          }
          value={details}
          onChange={(e) => handleDetailsChange(e.target.value)}
          rows={isOpen ? 4 : 2}
        />
        <VoiceRecorder onTranscription={handleTranscription} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.button
          className="cta-btn"
          onClick={onNext}
          disabled={!canContinue()}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Continuer →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
