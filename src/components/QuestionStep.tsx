import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
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
    setTimeout(onNext, 300);
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

  return (
    <motion.div
      className="step"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <h1 className="question-title">{question.title}</h1>
      {question.subtitle && <p className="question-subtitle">{question.subtitle}</p>}

      {question.type === 'intro' && (
        <button className="cta-btn" onClick={onNext}>
          {question.buttonText || 'Continuer →'}
        </button>
      )}

      {question.type === 'single-choice' && (
        <div className="options">
          {question.options.map((opt: any) => (
            <button
              key={opt.value}
              className={`option-btn ${answer === opt.value ? 'selected' : ''}`}
              onClick={() => handleSingleChoice(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi-choice' && (
        <>
          <div className="options">
            {question.options.map((opt: any) => (
              <button
                key={opt.value}
                className={`option-btn ${localMulti.includes(opt.value) ? 'selected' : ''}`}
                onClick={() => handleMultiToggle(opt.value)}
              >
                {opt.label}
                {localMulti.includes(opt.value) && <span className="check">✓</span>}
              </button>
            ))}
          </div>
          <button
            className="cta-btn"
            onClick={onNext}
            disabled={localMulti.length === 0}
          >
            Continuer →
          </button>
        </>
      )}

      {question.type === 'contact' && (
        <div className="contact-form">
          {(question.fields || ['name', 'email']).map((field: string) => (
            <input
              key={field}
              type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
              placeholder={
                field === 'name' ? 'Votre nom'
                : field === 'email' ? 'votre@email.com'
                : field === 'phone' ? '+41 79 000 00 00'
                : field
              }
              value={contactData[field] || ''}
              onChange={e => handleContactChange(field, e.target.value)}
              className="input-field"
            />
          ))}
          <button
            className="cta-btn"
            onClick={onNext}
            disabled={!isContactValid()}
          >
            Voir mon estimation →
          </button>
        </div>
      )}
    </motion.div>
  );
}
