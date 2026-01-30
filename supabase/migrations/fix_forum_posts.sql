-- Vérifier et créer la table forum_posts si nécessaire
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Utilisateur',
  is_anonymous BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);

-- Activer Row Level Security
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Anyone can read posts" ON forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON forum_posts;

-- Recréer les policies
CREATE POLICY "Anyone can read posts" ON forum_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON forum_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Créer la table forum_likes si elle n'existe pas
CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Index pour forum_likes
CREATE INDEX IF NOT EXISTS idx_forum_likes_user_id ON forum_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_post_id ON forum_likes(post_id);

-- RLS pour forum_likes
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read likes" ON forum_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON forum_likes;
DROP POLICY IF EXISTS "Users can unlike" ON forum_likes;

CREATE POLICY "Anyone can read likes" ON forum_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like" ON forum_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON forum_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Créer la table forum_comments si elle n'existe pas
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Utilisateur',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour forum_comments
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON forum_comments(created_at);

-- RLS pour forum_comments
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON forum_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON forum_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON forum_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON forum_comments;

CREATE POLICY "Anyone can read comments" ON forum_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment" ON forum_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON forum_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON forum_comments
  FOR DELETE
  USING (auth.uid() = user_id);
