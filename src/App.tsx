import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import QuestionStep from './components/QuestionStep';
import ResultStep from './components/ResultStep';
import ProgressBar from './components/ProgressBar';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import AccessGate from './components/AccessGate';
import translations from './data/translations.json';
import questionsI18n from './data/questions-i18n.json';
import './App.css';

export type AnswerEntry = { value: string[]; details: string } | string;
export type Answers = Record<string, AnswerEntry>;

type Language = 'fr' | 'en';

// Question structure with icons
const questionStructure = [
  { id: 'welcome', type: 'intro' },
  { id: 'activity', type: 'multi-choice', icons: { rental: 'home', concierge: 'building', restaurant: 'utensils-crossed', ecommerce: 'shopping-bag', services: 'briefcase', other: 'box' } },
  { id: 'goal', type: 'multi-choice', icons: { clients: 'target', branding: 'sparkles', seo: 'search', independence: 'unlink', all: 'rocket' } },
  { id: 'existing_site', type: 'multi-choice', icons: { none: 'plus-circle', old: 'alert-triangle', upgrade: 'arrow-up-circle', social_only: 'smartphone' } },
  { id: 'pages', type: 'multi-choice', icons: { '1': 'file', '3-5': 'files', '6-10': 'layout-grid', unknown: 'help-circle' } },
  { id: 'features', type: 'multi-choice', icons: { booking: 'calendar', multilingual: 'globe', gallery: 'image', chat: 'message-circle', form: 'clipboard-list', reviews: 'star', map: 'map-pin', mobile_app: 'smartphone' } },
  { id: 'style', type: 'multi-choice', icons: { minimal: 'minus', modern: 'zap', warm: 'leaf', bold: 'flame', trust: 'palette' } },
  { id: 'timeline', type: 'multi-choice', icons: { urgent: 'flame', month: 'calendar-days', relaxed: 'clock', exploring: 'eye' } },
  { id: 'contact', type: 'contact', fields: ['name', 'email', 'phone'] },
];

function App() {
  const [hasAccess, setHasAccess] = useState(false);
  const [language, setLanguage] = useState<Language>('fr');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const t = (translations as any)[language];
  const qi18n = (questionsI18n as any)[language];

  // Check access on mount
  useEffect(() => {
    if (sessionStorage.getItem('discovery_access') === 'granted') {
      setHasAccess(true);
    }
  }, []);

  // Build questions from structure + i18n
  const questions = questionStructure.map(q => {
    const base = qi18n[q.id];
    if (q.type === 'intro') {
      return { ...q, ...base };
    }
    if (q.type === 'multi-choice') {
      const options = Object.entries(base.options).map(([value, label]) => ({
        value,
        label,
        icon: (q as any).icons?.[value] || 'circle',
      }));
      return {
        ...q,
        title: base.title,
        subtitle: base.subtitle,
        detailsPlaceholder: base.detailsPlaceholder,
        options,
      };
    }
    if (q.type === 'contact') {
      return {
        ...q,
        title: base.title,
        subtitle: base.subtitle,
        fields: q.fields,
        placeholders: {
          name: base.name,
          email: base.email,
          phone: base.phone,
        },
      };
    }
    return q;
  });

  const totalSteps = questions.length;
  const isResult = currentStep >= totalSteps;

  const handleAnswer = useCallback((questionId: string, value: any) => {
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

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
  };

  if (!hasAccess) {
    return (
      <div className="app">
        <LanguageToggle language={language} onToggle={toggleLanguage} />
        <div className="container">
          <AccessGate onUnlock={() => setHasAccess(true)} t={t} />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ThemeToggle />
      <LanguageToggle language={language} onToggle={toggleLanguage} />

      {!isResult && currentStep > 0 && (
        <ProgressBar current={currentStep} total={totalSteps} />
      )}

      <div className="container">
        {currentStep > 0 && !isResult && (
          <button className="back-btn" onClick={back}>
            {t.nav.back}
          </button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {isResult ? (
            <ResultStep
              key="result"
              answers={answers}
              submitted={submitted}
              onSubmit={handleSubmit}
              direction={direction}
              t={t}
              language={language}
            />
          ) : (
            <QuestionStep
              key={currentStep}
              question={questions[currentStep]}
              answer={answers[questions[currentStep].id]}
              onAnswer={handleAnswer}
              onNext={next}
              direction={direction}
              t={t}
              language={language}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
