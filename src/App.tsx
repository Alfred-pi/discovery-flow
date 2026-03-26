import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import data from './data/questions.json';
import QuestionStep from './components/QuestionStep';
import ResultStep from './components/ResultStep';
import ProgressBar from './components/ProgressBar';
import './App.css';

export type Answers = Record<string, string | string[]>;

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const questions = data.questions;
  const totalSteps = questions.length;
  const isResult = currentStep >= totalSteps;

  const handleAnswer = useCallback((questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentStep(prev => prev + 1);
  }, []);

  const back = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const calculatePrice = useCallback(() => {
    let total = data.pricing.base;
    for (const q of questions) {
      if (q.type === 'intro' || q.type === 'contact') continue;
      const answer = answers[q.id];
      if (!answer) continue;
      const opts = (q as any).options || [];
      if (Array.isArray(answer)) {
        for (const a of answer) {
          const opt = opts.find((o: any) => o.value === a);
          if (opt) total += opt.priceWeight || 0;
        }
      } else {
        const opt = opts.find((o: any) => o.value === answer);
        if (opt) total += opt.priceWeight || 0;
      }
    }
    return Math.max(total, data.pricing.min);
  }, [answers, questions]);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    const payload = {
      answers,
      estimatedPrice: calculatePrice(),
      timestamp: new Date().toISOString(),
    };
    console.log('Submission:', payload);
    if (data.config.webhookUrl) {
      try {
        await fetch(data.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error('Webhook failed:', e);
      }
    }
  }, [answers, calculatePrice]);

  return (
    <div className="app" style={{ '--accent': data.config.accentColor } as React.CSSProperties}>
      {!isResult && currentStep > 0 && (
        <ProgressBar current={currentStep} total={totalSteps} />
      )}

      <div className="container">
        {currentStep > 0 && !isResult && (
          <button className="back-btn" onClick={back}>
            ← Retour
          </button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {isResult ? (
            <ResultStep
              key="result"
              price={calculatePrice()}
              currency={data.pricing.currency || data.config.currency}
              label={data.pricing.label}
              disclaimer={data.pricing.disclaimer}
              submitted={submitted}
              onSubmit={handleSubmit}
              answers={answers}
              direction={direction}
            />
          ) : (
            <QuestionStep
              key={currentStep}
              question={questions[currentStep]}
              answer={answers[questions[currentStep].id]}
              onAnswer={handleAnswer}
              onNext={next}
              direction={direction}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
