# Email Verifier Frontend

Frontend Next.js pour l'outil de vérification d'emails.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Lancer en production
npm start
```

## 📁 Structure

```
src/
├── components/          # Composants réutilisables
│   └── Navigation.tsx   # Barre de navigation
├── pages/              # Pages Next.js
│   ├── index.tsx       # Page d'accueil
│   ├── verify.tsx      # Vérification d'email unique
│   ├── upload.tsx      # Upload CSV
│   └── results/        # Pages de résultats
│       └── [jobId].tsx # Résultats d'un job
├── styles/             # Styles CSS
│   └── globals.css     # Styles globaux avec Tailwind
└── _app.tsx           # Configuration de l'app
```

## 🎨 Technologies

- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Icônes
- **React Dropzone** - Upload de fichiers
- **React Hot Toast** - Notifications

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### API Endpoints

Le frontend communique avec le backend via ces endpoints :

- `POST /api/verify` - Vérification d'email unique
- `POST /api/upload` - Upload de fichier CSV
- `GET /api/upload/job/:jobId` - Statut d'un job
- `GET /api/upload/job/:jobId/results` - Résultats d'un job

## 📱 Pages

### 1. Page d'accueil (`/`)

- Présentation de l'outil
- Navigation vers les fonctionnalités
- Aperçu des validations disponibles

### 2. Vérification unique (`/verify`)

- Formulaire de saisie d'email
- Validation en temps réel
- Affichage des résultats détaillés

### 3. Upload CSV (`/upload`)

- Drag & drop de fichiers CSV
- Validation de format et taille
- Redirection vers les résultats

### 4. Résultats (`/results/[jobId]`)

- Suivi en temps réel du traitement
- Statistiques de validation
- Tableau des résultats
- Téléchargement des résultats

## 🎯 Fonctionnalités

- ✅ **Interface moderne** avec Tailwind CSS
- ✅ **Responsive design** pour mobile et desktop
- ✅ **Upload drag & drop** avec validation
- ✅ **Suivi en temps réel** des jobs
- ✅ **Notifications** avec React Hot Toast
- ✅ **Navigation** entre les pages
- ✅ **Téléchargement** des résultats en CSV

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests en mode watch
npm run test:watch
```

## 📦 Build

```bash
# Build de production
npm run build

# Analyser le bundle
npm run analyze
```

## 🚀 Déploiement

Le projet peut être déployé sur :

- Vercel (recommandé pour Next.js)
- Netlify
- AWS Amplify
- Docker

### Docker

```bash
# Build de l'image
docker build -t email-verifier-frontend .

# Lancer le container
docker run -p 3000:3000 email-verifier-frontend
```
