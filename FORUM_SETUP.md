# 📝 Configuration du Forum Communautaire

## Problème actuel

Les messages du forum sont actuellement stockés localement et disparaissent au rechargement. Pour que tous les utilisateurs puissent communiquer ensemble et que les messages restent, il faut créer une table dans Supabase.

## Solution : Créer la table forum_posts dans Supabase

### Étape 1 : Accéder à l'éditeur SQL de Supabase

1. Va sur **https://supabase.com/dashboard**
2. Sélectionne ton projet **Smart Stop**
3. Dans le menu de gauche, clique sur **SQL Editor**
4. Clique sur **New Query** (ou **+ New query**)

### Étape 2 : Copier et exécuter le script SQL

Copie tout le contenu ci-dessous et colle-le dans l'éditeur SQL, puis clique sur **Run** (ou appuie sur Ctrl+Enter) :

```sql
-- Créer la table forum_posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);

-- Activer Row Level Security
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les posts
CREATE POLICY "Anyone can read posts" ON forum_posts
  FOR SELECT
  USING (true);

-- Politique: Les utilisateurs connectés peuvent créer des posts
CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres posts
CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres posts
CREATE POLICY "Users can delete own posts" ON forum_posts
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Étape 3 : Vérifier la création

1. Dans le menu de gauche, clique sur **Table Editor**
2. Tu devrais voir la table **forum_posts** dans la liste
3. Clique dessus pour voir sa structure

### Étape 4 : Déployer le code mis à jour

Le code a déjà été modifié pour utiliser Supabase au lieu du stockage local. Une fois la table créée, les changements suivants seront actifs :

✅ **Les messages sont sauvegardés dans Supabase**
✅ **Tous les utilisateurs voient les mêmes messages**
✅ **Les messages restent après rechargement**
✅ **Mise à jour en temps réel** (les nouveaux messages apparaissent automatiquement)

---

## Structure de la table forum_posts

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique du post (généré automatiquement) |
| `topic_id` | TEXT | Identifiant du topic (ex: 'presentations', 'motivation', 'conseils') |
| `user_id` | UUID | ID de l'utilisateur qui a créé le post |
| `content` | TEXT | Contenu du message (max 500 caractères côté frontend) |
| `created_at` | TIMESTAMP | Date et heure de création |
| `updated_at` | TIMESTAMP | Date et heure de dernière modification |

---

## Sécurité (Row Level Security)

Les politiques de sécurité garantissent que :

- ✅ **Tout le monde peut lire** les messages (même non connecté)
- ✅ **Seuls les utilisateurs connectés** peuvent créer des messages
- ✅ **Chaque utilisateur** peut modifier/supprimer **uniquement ses propres messages**
- ❌ **Impossible de modifier** les messages des autres

---

## Test du forum

Après avoir créé la table :

1. **Ouvre l'app** Smart Stop (ou rafraîchis-la)
2. **Va dans Communauté** (icône 👥 en bas)
3. **Clique sur "Présentation"**
4. **Écris un message** et clique sur "Publier"
5. **Ouvre l'app sur un autre appareil** ou un autre compte → le message doit être visible !

---

## Prochaines étapes (optionnel)

### Ajouter les autres topics

Une fois le topic "Présentation" fonctionnel, tu pourras créer les pages pour :
- **Motivation & Soutien** → `/community/motivation/page.jsx`
- **Conseils & Astuces** → `/community/conseils/page.jsx`

(Le code sera identique, il suffit de changer `topic_id`)

### Fonctionnalités futures

- 💬 **Réponses aux posts** (commentaires)
- ❤️ **Réactions** (likes, encouragements)
- 🔔 **Notifications** pour les nouveaux messages
- 📊 **Compteur de posts** sur les cartes de topics
- 🗑️ **Bouton supprimer** pour ses propres messages

---

## Besoin d'aide ?

Si tu rencontres des erreurs :

1. **Vérifie les logs Supabase** : Table Editor > forum_posts > Logs
2. **Vérifie la console du navigateur** : F12 > Console (pour voir les erreurs JavaScript)
3. **Vérifie que les politiques RLS** sont bien créées : Authentication > Policies
