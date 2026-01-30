'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function PresentationsTopicPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Charger le profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Charger les posts depuis Supabase
      await loadPosts()

      setLoading(false)
    }

    loadData()

    // S'abonner aux nouveaux posts en temps réel
    const channel = supabase
      .channel('forum_posts_presentations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_posts',
          filter: 'topic_id=eq.presentations'
        },
        (payload) => {
          // Charger les informations du profil pour le nouveau post
          loadPostWithProfile(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('topic_id', 'presentations')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Charger les profils pour tous les posts
      const userIds = [...new Set(postsData.map(post => post.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name')
        .in('id', userIds)

      // Mapper les posts avec les noms des utilisateurs
      const postsWithNames = postsData.map(post => {
        const userProfile = profilesData?.find(p => p.id === post.user_id)
        return {
          ...post,
          user_name: userProfile?.first_name || 'Anonyme'
        }
      })

      setPosts(postsWithNames)
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error)
    }
  }

  const loadPostWithProfile = async (post) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', post.user_id)
        .single()

      const postWithName = {
        ...post,
        user_name: profileData?.first_name || 'Anonyme'
      }

      setPosts(prevPosts => [postWithName, ...prevPosts])
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    }
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!newPost.trim() || posting) return

    setPosting(true)

    try {
      // Sauvegarder dans Supabase
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          topic_id: 'presentations',
          user_id: user.id,
          content: newPost.trim()
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter le post localement avec le nom de l'utilisateur
      const postWithName = {
        ...data,
        user_name: profile?.first_name || 'Anonyme'
      }

      setPosts([postWithName, ...posts])
      setNewPost('')
    } catch (error) {
      console.error('Erreur lors de la publication:', error)
      alert('Erreur lors de la publication du message. Réessaye.')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0612] via-[#1a0d2e] to-[#0d0520] text-white pb-24">
      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[450px] h-[450px] bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-[120px] opacity-40" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[350px] h-[350px] bg-gradient-to-br from-pink-600 to-purple-600 rounded-full blur-[120px] opacity-40" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👋</span>
              Présentation
            </h1>
            <p className="text-purple-300 text-xs">Présente-toi à la communauté</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-24 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Formulaire de nouveau post */}
          <form onSubmit={handlePostSubmit} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Partage ton histoire</h3>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Présente-toi : qui es-tu, depuis combien de temps fumes-tu, pourquoi veux-tu arrêter..."
              className="w-full h-32 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-purple-300 text-xs">{newPost.length}/500 caractères</span>
              <button
                type="submit"
                disabled={!newPost.trim() || posting}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </form>

          {/* Liste des posts */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>💬</span>
              {posts.length} {posts.length <= 1 ? 'message' : 'messages'}
            </h3>

            {posts.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-purple-300 mb-2">Aucun message pour le moment</p>
                <p className="text-purple-400 text-sm">Sois le premier à te présenter !</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold">
                      {post.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">{post.user_name}</span>
                        <span className="text-purple-400 text-xs">
                          {new Date(post.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-purple-100 text-sm whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
