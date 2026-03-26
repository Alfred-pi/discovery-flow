# Discovery Flow V3 — Client Intake Pro

## Concept
Un outil de discovery client premium. Le client répond à des questions, peut taper du texte libre, ou enregistrer un message vocal à chaque étape. Le freelance reçoit un brief complet (choix + notes + transcriptions).

## UX Flow
1. **Welcome** — Écran d'accueil avec branding configurable
2. **Questions** — Chaque question a :
   - Choix (single/multi select) 
   - Zone "Ajoutez des détails" (textarea expandable, optionnel)
   - Bouton micro 🎙️ (record → transcrit via Whisper API → affiché dans la textarea)
   - Bouton "Continuer" (actif dès qu'un choix est fait)
3. **Open Questions** — Type "open" = pas de choix, juste texte libre + micro
4. **Contact** — Nom, email, téléphone
5. **Summary** — Récap complet de toutes les réponses + estimation prix + bouton submit

## Composants
- `App.tsx` — Router de steps, state global
- `WelcomeStep.tsx` — Intro animée
- `QuestionStep.tsx` — Gère single/multi/open + textarea + voice
- `ContactStep.tsx` — Formulaire contact
- `SummaryStep.tsx` — Récap + pricing + submit
- `VoiceRecorder.tsx` — Bouton micro, MediaRecorder API, envoi à Whisper
- `ProgressBar.tsx` — Barre de progression
- `ThemeToggle.tsx` — Dark/Light

## Voice Recording
- `MediaRecorder` API (browser natif)
- Format: webm/opus
- Envoi POST `/api/transcribe` → proxy vers OpenAI Whisper API
- Transcription affichée dans la textarea
- Fallback: si pas de micro, bouton caché gracefully

## Backend Minimal (Vite dev server proxy)
- `server/index.ts` — Express minimal
- `POST /api/transcribe` — Proxy vers OpenAI Whisper (clé côté serveur!)
- `POST /api/submit` — Reçoit le brief complet, log + webhook

## Data Model (questions.json)
```json
{
  "config": {
    "brand": "Votre Nom",
    "accentColor": "#6366f1",
    "currency": "CHF",
    "webhookUrl": null,
    "whisperModel": "whisper-1"
  },
  "questions": [
    {
      "id": "project_type",
      "type": "single-choice",
      "title": "Quel type de projet avez-vous ?",
      "detailsPrompt": "Décrivez brièvement votre projet...",
      "options": [...]
    },
    {
      "id": "vision",
      "type": "open",
      "title": "Décrivez votre vision du projet",
      "placeholder": "Parlez librement ou tapez ici..."
    }
  ],
  "pricing": { "base": 1500, "min": 800, ... }
}
```

## Design
- Garder le design V2 (oklch, dark mode, spring animations)
- Ajouter: textarea expandable, voice recorder pill, summary cards
- Mobile-first, touch targets 44px+
- Voice button = pill rouge pulsante pendant enregistrement

## Stack
- React 19 + Vite 8 + TypeScript + Framer Motion
- Express backend minimal (pour Whisper proxy)
- Pas de DB — tout envoyé par webhook au submit
