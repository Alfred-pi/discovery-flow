# Discovery Flow v3

Formulaire de découverte multi-langue (FR/EN) avec authentification + dashboard admin.

## 🌐 URLs

- **Client Form**: https://alfred-pi.github.io/discovery-flow/
- **Admin Dashboard**: http://100.84.147.44:3001/admin (Tailscale uniquement)

## 🔐 Accès

### Client (Form)
- **Code d'accès**: `BLUE47`

### Admin (Dashboard)
- **Mot de passe**: `***REMOVED***`

## 🚀 Démarrage

### Frontend (Dev)
```bash
npm run dev -- --host --port 4070
```

### Backend (Express)
```bash
cd backend
npm run dev
```
Port 3001 (accessible via Tailscale `100.84.147.44:3001`)

### Deploy Frontend
```bash
npm run deploy
```
Build + push vers GitHub Pages (`alfred-pi.github.io/discovery-flow`)

## 📂 Fichiers Submissions

Les réponses clients sont sauvegardées dans:
```
submissions/YYYY-MM-DDTHH-mm-ss.md
```

Format markdown propre, prêt à traffer.

## 🔒 Sécurité

- Code d'accès `BLUE47` protège le formulaire (sessionStorage)
- Backend sécurisé: JWT token + rate limit (5/h) + CORS strict + Helmet + Zod validation
- Port 3001 accessible UNIQUEMENT via Tailscale (pas internet public)
- Fichiers submissions: `chmod 600`

## 🎨 Features

- **Multi-langue**: FR/EN avec toggle
- **Multi-choix**: Toutes les questions permettent sélections multiples
- **Textarea détails**: Champ "Précisez" sous chaque question
- **Voice input**: Web Speech API gratuit (Chrome/Safari)
- **Admin dashboard**: Liste submissions + modal détails
- **Dark mode**: Design zinc/indigo professionnel
- **Responsive**: Mobile-first (375px) → Tablet → Desktop
- **Questions universelles**: Site web, App web, App mobile, E-commerce, Refonte, Automation, Branding
- **Budget**: 2'500 CHF minimum (6 fourchettes)

## 📝 Stack

**Frontend**: React 19 + Vite 8 + Framer Motion + Lucide + Tailwind-free CSS  
**Backend**: Express + Helmet + Zod + Rate Limit + CORS  
**Deploy**: GitHub Pages + Backend Pi (Tailscale)

## 🛠️ Maintenance

**Voir les logs backend**:
```bash
cd ~/Repos/workspace/perso/discovery-flow/backend
pm2 logs discovery-flow
```

**Restart backend**:
```bash
pm2 restart discovery-flow
```
