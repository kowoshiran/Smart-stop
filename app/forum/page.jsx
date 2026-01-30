'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import SOSButton from '@/components/SOSButton'

// Composant pour les étoiles animées
function StarField() {
  const [stars, setStars] = useState([])

  useEffect(() => {
    const newStars = []
    for (let i = 0; i < 60; i++) {
      newStars.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
        size: Math.random() > 0.5 ? '2px' : '1px'
      })
    }
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
    </div>
  )
}

const categories = {
  presentation: { label: 'Présentation', emoji: '👋', color: 'from-purple-500 to-pink-500', description: 'Présente-toi à la communauté' },
  victory: { label: 'Victoires', emoji: '🎉', color: 'from-emerald-500 to-cyan-500', description: 'Partage tes réussites et célèbre tes victoires' },
  challenge: { label: 'Challenges', emoji: '💪', color: 'from-orange-500 to-red-500', description: 'Les difficultés et défis du sevrage' },
  advice: { label: 'Conseils', emoji: '💡', color: 'from-yellow-500 to-orange-500', description: 'Astuces et conseils pratiques' },
  support: { label: 'Soutien', emoji: '🤝', color: 'from-pink-500 to-purple-500', description: 'Entraide et soutien moral' },
  journal: { label: 'Nos Journaux', emoji: '📓', color: 'from-indigo-500 to-purple-500', description: 'Journaux partagés par la communauté' },
  free: { label: 'Espace libre', emoji: '💬', color: 'from-gray-500 to-purple-500', description: 'Exprime-toi sans jugement' },
}

const moodEmojis = {
  terrible: { emoji: '😭', label: 'Terrible' },
  bad: { emoji: '😔', label: 'Difficile' },
  neutral: { emoji: '😐', label: 'Neutre' },
  good: { emoji: '😊', label: 'Bien' },
  great: { emoji: '😄', label: 'Super' },
}

export default function ForumPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null) // null = vue catégories, sinon = vue discussions
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState('')

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    isAnonymous: false,
  })
  const [journalsByUser, setJournalsByUser] = useState({})
  const [categoryCounts, setCategoryCounts] = useState({})

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  // Vérifier si on doit ouvrir directement la catégorie "support" depuis SOS
  useEffect(() => {
    const sosCategory = localStorage.getItem('forum_category')
    if (sosCategory === 'support') {
      setSelectedCategory('support')
      localStorage.removeItem('forum_category')
    }
  }, [])

  const loadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Si aucune catégorie sélectionnée, charger les compteurs pour chaque catégorie
      if (!selectedCategory) {
        const counts = {}
        for (const [key, cat] of Object.entries(categories)) {
          const { count } = await supabase
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('category', key)
          counts[key] = count || 0
        }
        setCategoryCounts(counts)
        setLoading(false)
        return
      }

      // Sinon, charger les posts de la catégorie sélectionnée
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('category', selectedCategory)
        .order('created_at', { ascending: false })

      if (!postsError && postsData) {
        // Charger les likes de l'utilisateur
        const { data: userLikes } = await supabase
          .from('forum_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .not('post_id', 'is', null)

        const likedPostIds = new Set(userLikes?.map(l => l.post_id) || [])

        const enrichedPosts = postsData.map(post => ({
          ...post,
          isLiked: likedPostIds.has(post.id)
        }))

        setPosts(enrichedPosts)

        // Si on est dans "Nos Journaux", grouper par utilisateur
        if (selectedCategory === 'journal') {
          const grouped = {}
          enrichedPosts.forEach(post => {
            const userId = post.user_id
            if (!grouped[userId]) {
              grouped[userId] = []
            }
            grouped[userId].push(post)
          })
          setJournalsByUser(grouped)
        } else {
          setJournalsByUser({})
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Remplis le titre et le contenu !')
      return
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: user.id,
          author_name: newPost.isAnonymous ? 'Anonyme' : 'Utilisateur',
          is_anonymous: newPost.isAnonymous,
          category: selectedCategory, // Utilise la catégorie sélectionnée
          title: newPost.title.trim(),
          content: newPost.content.trim(),
        })

      if (error) throw error

      setNewPost({
        title: '',
        content: '',
        isAnonymous: false,
      })
      setShowNewPostForm(false)
      await loadData()
      alert('✅ Ta discussion a été publiée !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de la publication')
    }
  }

  const handleLike = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId)

      if (post.isLiked) {
        // Retirer le like
        await supabase
          .from('forum_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId)
      } else {
        // Ajouter le like
        await supabase
          .from('forum_likes')
          .insert({
            user_id: user.id,
            post_id: postId,
          })
      }

      await loadData()
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors du like')
    }
  }

  const handleExpandPost = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      return
    }

    setExpandedPost(postId)

    try {
      const { data: commentsData } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      setComments({ ...comments, [postId]: commentsData || [] })
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return

    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          author_name: 'Utilisateur',
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      await handleExpandPost(postId)
      await loadData()
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de l\'ajout du commentaire')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white pb-24">
      <StarField />

      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-[100px] opacity-30" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg">
              🌿
            </div>
            <span className="text-lg font-bold text-white">Smart Stop</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">💬 Communauté</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* VUE CATÉGORIES */}
          {!selectedCategory && (
            <div className="space-y-4">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">👥 Communauté</h2>
                <p className="text-purple-300">Choisis un topic pour voir les discussions et partager ton expérience</p>
              </div>

              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className="w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all text-left group relative overflow-hidden"
                >
                  {/* Gradient de fond */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${cat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

                  {/* Barre colorée sur le côté gauche */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${cat.color}`} />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{cat.emoji}</span>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">{cat.label}</h3>
                      </div>
                      <p className="text-sm text-purple-300">{cat.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{categoryCounts[key] || 0}</div>
                      <div className="text-xs text-purple-400">discussions</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* VUE DISCUSSIONS */}
          {selectedCategory && (
            <>
              {/* Bouton retour + header catégorie */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 text-purple-300 hover:text-white transition mb-3"
                >
                  ← Retour aux catégories
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{categories[selectedCategory].emoji}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{categories[selectedCategory].label}</h2>
                    <p className="text-sm text-purple-300">{categories[selectedCategory].description}</p>
                  </div>
                </div>
              </div>

              {/* Bouton ajouter une discussion (sauf pour "Nos Journaux") */}
              {selectedCategory !== 'journal' && !showNewPostForm && (
                <button
                  onClick={() => setShowNewPostForm(true)}
                  className="w-full mb-6 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all shadow-lg"
                >
                  ➕ Ajouter une discussion
                </button>
              )}

              {/* Formulaire nouvelle discussion */}
              {showNewPostForm && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">✍️ Nouvelle discussion</h2>
                    <button
                      onClick={() => setShowNewPostForm(false)}
                      className="text-purple-300 hover:text-white transition"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreatePost} className="space-y-4">
                    {/* Titre */}
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        placeholder="Titre de ta discussion..."
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                        required
                      />
                    </div>

                    {/* Contenu */}
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Contenu
                      </label>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        placeholder="Partage ton expérience, pose une question, donne un conseil..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none"
                        required
                      />
                    </div>

                    {/* Anonyme */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPost.isAnonymous}
                        onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/10 border-white/20"
                      />
                      <span className="text-sm text-purple-200">Publier en anonyme</span>
                    </label>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewPostForm(false)}
                        className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all"
                      >
                        Publier
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Liste des discussions */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-bold text-white mb-2">Aucune discussion pour le moment</h3>
                    <p className="text-purple-300">Sois le premier à partager ton expérience !</p>
                  </div>
                ) : selectedCategory === 'journal' && Object.keys(journalsByUser).length > 0 ? (
                  // Affichage groupé pour les journaux
                  Object.entries(journalsByUser).map(([userId, userPosts]) => (
                    <div key={userId} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📓 Journal de {userPosts[0].author_name}
                        <span className="text-sm font-normal text-purple-300">({userPosts.length} {userPosts.length > 1 ? 'entrées' : 'entrée'})</span>
                      </h3>
                      <div className="space-y-3">
                        {userPosts.map((post) => {
                          const isExpanded = expandedPost === post.id
                          const postComments = comments[post.id] || []

                          return (
                            <div key={post.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                              {/* Date */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-purple-400">{formatDate(post.created_at)}</span>
                                {post.mood && (
                                  <span className="text-lg">{moodEmojis[post.mood]?.emoji || '😐'}</span>
                                )}
                              </div>

                              {/* Titre */}
                              {post.title && (
                                <h4 className="text-md font-semibold text-white mb-2">{post.title}</h4>
                              )}

                              {/* Contenu */}
                              <p className="text-purple-200 text-sm mb-3 whitespace-pre-wrap line-clamp-3">{post.content}</p>

                              {/* Tags */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {post.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleLike(post.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-all ${
                                    post.isLiked
                                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                  }`}
                                >
                                  <span className="text-xs">{post.isLiked ? '❤️' : '🤍'}</span>
                                  <span className="text-xs">{post.likes_count}</span>
                                </button>

                                <button
                                  onClick={() => handleExpandPost(post.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-purple-200 hover:bg-white/20 transition-all text-sm"
                                >
                                  <span className="text-xs">💬</span>
                                  <span className="text-xs">{post.comments_count}</span>
                                </button>
                              </div>

                              {/* Commentaires */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                                  {postComments.map((comment) => (
                                    <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs font-semibold text-purple-200">{comment.author_name}</span>
                                        <span className="text-xs text-purple-400">{formatDate(comment.created_at)}</span>
                                      </div>
                                      <p className="text-xs text-white whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                  ))}

                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      placeholder="Ajoute un commentaire..."
                                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleAddComment(post.id)
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleAddComment(post.id)}
                                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 transition-all text-sm"
                                    >
                                      ➤
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  // Affichage normal pour les autres catégories
                  posts.map((post) => {
                    const isExpanded = expandedPost === post.id
                    const postComments = comments[post.id] || []

                    return (
                      <div
                        key={post.id}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{post.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-purple-400">
                              <span>{post.author_name}</span>
                              <span>•</span>
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contenu */}
                        <p className="text-purple-200 mb-4 whitespace-pre-wrap">{post.content}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                              post.isLiked
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                : 'bg-white/10 text-purple-200 hover:bg-white/20'
                            }`}
                          >
                            <span>{post.isLiked ? '❤️' : '🤍'}</span>
                            <span className="text-sm">{post.likes_count}</span>
                          </button>

                          <button
                            onClick={() => handleExpandPost(post.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-purple-200 hover:bg-white/20 transition-all"
                          >
                            <span>💬</span>
                            <span className="text-sm">{post.comments_count}</span>
                          </button>
                        </div>

                        {/* Commentaires */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {postComments.length === 0 ? (
                              <p className="text-sm text-purple-400 text-center py-2">Aucun commentaire pour le moment</p>
                            ) : (
                              postComments.map((comment) => (
                                <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-sm font-semibold text-purple-200">{comment.author_name}</span>
                                    <span className="text-xs text-purple-400">{formatDate(comment.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-white whitespace-pre-wrap">{comment.content}</p>
                                </div>
                              ))
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Ajoute un commentaire..."
                                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(post.id)
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 transition-all"
                              >
                                ➤
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

        </div>
      </main>

      <BottomNav />
      <SOSButton />
    </div>
  )
}
