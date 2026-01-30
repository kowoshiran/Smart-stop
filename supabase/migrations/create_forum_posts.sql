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
