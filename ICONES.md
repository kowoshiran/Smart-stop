# 📱 Guide des Icônes - Smart Stop

## 🎨 Où placer ton icône

### Option 1 : Icône simple (Recommandé pour commencer)

Place ton fichier **icon.png** directement dans le dossier `app/` :

```
mon-app/
└── app/
    └── icon.png  ← 512x512px minimum
```

Next.js générera automatiquement toutes les tailles nécessaires.

### Option 2 : Configuration complète PWA

Pour une expérience d'app native, place ces fichiers dans `public/` :

```
mon-app/
└── public/
    ├── icon-192.png   (192x192px)
    ├── icon-512.png   (512x512px)
    └── manifest.json  (déjà créé)
```

## 🛠️ Comment créer tes icônes

### Méthode 1 : Générateur en ligne (Facile)

1. Va sur **[favicon.io](https://favicon.io/favicon-generator/)** ou **[realfavicongenerator.net](https://realfavicongenerator.net/)**
2. Upload ton logo/image
3. Télécharge le pack d'icônes
4. Place les fichiers aux bons endroits

### Méthode 2 : Design personnalisé

**Recommandations de design :**
- Taille de base : **512x512px** (carré)
- Format : **PNG** avec fond opaque
- Couleur de fond : **#0a0612** (fond violet foncé de l'app)
- Icône simple : Emoji 🌿 ou 🚭 sur fond violet
- Bordure arrondie : Non nécessaire (iOS et Android l'ajoutent automatiquement)

**Exemple simple avec Canva :**
1. Crée un carré 512x512px
2. Fond violet foncé (#0a0612)
3. Ajoute un emoji 🌿 ou texte "SS" en blanc
4. Exporte en PNG

### Méthode 3 : Générateur automatique (Très rapide)

Si tu veux juste tester rapidement, j'ai créé une icône de placeholder.

## ✅ Vérification

Après avoir ajouté tes icônes :

1. **En local :**
   ```bash
   npm run dev
   ```
   Ouvre http://localhost:3000 et vérifie l'icône dans l'onglet

2. **Sur mobile :**
   - Ouvre l'app dans le navigateur
   - "Ajouter à l'écran d'accueil"
   - Vérifie que l'icône s'affiche correctement

## 📦 Fichiers nécessaires

### Minimum (Next.js s'occupe du reste) :
- `app/icon.png` (512x512px)

### Complet (PWA) :
- `public/icon-192.png` (192x192px)
- `public/icon-512.png` (512x512px)
- `public/manifest.json` ✅ (déjà créé)
- `app/layout.tsx` ✅ (déjà configuré)

## 🎯 Recommandation finale

**Pour commencer rapidement :**
Place simplement un `icon.png` de 512x512px dans le dossier `app/` et Next.js fera le reste automatiquement !
