import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import data from './data/questions.json';
import type { Answers, ContactInfo } from './types';
import QuestionStep from './components/QuestionStep';
import ContactStep from './components/ContactStep';
import SummaryStep from './components/SummaryStep';
import ProgressBar from './components/ProgressBar';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

type Step = 'welcome' | 'questions' | 'contact' | 'summary';

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState<ContactInfo>({ name: '', email: '', phone: '' });
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const questions = data.questions;
  const totalSteps = questions.length + 1; // questions + contact
  const currentProgress =
    step === 'questions'
      ? questionIndex + 1
      : step === 'contact'
        ? questions.length + 1
        : 0;

  const showProgress = step === 'questions' || step === 'contact';

  const handleAnswer = useCallback((questionId: string, entry: Answers[string]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: entry }));
  }, []);

  const next = useCallback(() => {
    setDirection(1);
    if (step === 'welcome') {
      setStep('questions');
    } else if (step === 'questions') {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((i) => i + 1);
      } else {
        setStep('contact');
      }
    } else if (step === 'contact') {
      setStep('summary');
    }
  }, [step, questionIndex, questions.length]);

  const back = useCallback(() => {
    setDirection(-1);
    if (step === 'questions') {
      if (questionIndex > 0) {
        setQuestionIndex((i) => i - 1);
      } else {
        setStep('welcome');
      }
    } else if (step === 'contact') {
      setStep('questions');
      setQuestionIndex(questions.length - 1);
    } else if (step === 'summary') {
      setStep('contact');
    }
  }, [step, questionIndex, questions.length]);

  const calculatePrice = useCallback(() => {
    let total = data.pricing.base;
    for (const q of questions) {
      const entry = answers[q.id];
      if (!entry?.value) continue;
      const opts = (q as Record<string, unknown>).options as
        | { value: string; priceWeight: number }[]
        | undefined;
      if (!opts) continue;
      const val = entry.value;
      if (Array.isArray(val)) {
        for (const v of val) {
          const opt = opts.find((o) => o.value === v);
          if (opt) total += opt.priceWeight || 0;
        }
      } else {
        const opt = opts.find((o) => o.value === val);
        if (opt) total += opt.priceWeight || 0;
      }
    }
    return Math.max(total, data.pricing.min);
  }, [answers, questions]);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    const payload = {
      answers,
      contact,
      estimatedPrice: calculatePrice(),
      timestamp: new Date().toISOString(),
    };
    console.log('Submission:', payload);
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Submit failed:', e);
    }
  }, [answers, contact, calculatePrice]);

  const currentQuestion = questions[questionIndex];

  return (
    <div className="app">
      <ThemeToggle />

      {showProgress && <ProgressBar current={currentProgress} total={totalSteps} />}

      <div className="container">
        {step !== 'welcome' && step !== 'summary' && (
          <button className="back-btn" onClick={back}>
            ← Retour
          </button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              className="step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.h1
                className="question-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Créons votre projet ensemble
              </motion.h1>
              <motion.p
                className="question-subtitle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Répondez à quelques questions pour recevoir une estimation
                personnalisée en 2 minutes.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.button
                  className="cta-btn"
                  onClick={next}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  C'est parti →
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === 'questions' && (
            <QuestionStep
              key={currentQuestion.id}
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswer={handleAnswer}
              onNext={next}
              direction={direction}
            />
          )}

          {step === 'contact' && (
            <ContactStep
              key="contact"
              contact={contact}
              onChange={setContact}
              onNext={next}
              direction={direction}
            />
          )}

          {step === 'summary' && (
            <SummaryStep
              key="summary"
              questions={questions}
              answers={answers}
              contact={contact}
              price={calculatePrice()}
              currency={data.pricing.currency}
              disclaimer={data.pricing.disclaimer}
              onSubmit={handleSubmit}
              submitted={submitted}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
