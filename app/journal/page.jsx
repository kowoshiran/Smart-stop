'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { checkAndUnlockBadges } from '@/Lib/badgeUtils'
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
        width: Math.random() * 2 + 1,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: Math.random() * 3 + 3,
      })
    }
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: star.width + 'px',
            height: star.width + 'px',
            top: star.top + '%',
            left: star.left + '%',
            animationDelay: star.delay + 's',
            animationDuration: star.duration + 's',
          }}
        />
      ))}
    </div>
  )
}

const moodEmojis = {
  terrible: { emoji: '😭', label: 'Terrible', color: 'from-red-500 to-pink-500' },
  bad: { emoji: '😔', label: 'Difficile', color: 'from-orange-500 to-red-500' },
  neutral: { emoji: '😐', label: 'Neutre', color: 'from-gray-500 to-purple-500' },
  good: { emoji: '😊', label: 'Bien', color: 'from-emerald-500 to-cyan-500' },
  great: { emoji: '😄', label: 'Super', color: 'from-cyan-500 to-purple-500' },
}

const availableTags = [
  'Victoire 🎉',
  'Difficulté 😓',
  'Craving 🚬',
  'Motivation 💪',
  'Fierté ⭐',
  'Anxiété 😰',
  'Détermination 🔥',
  'Rechute 😞',
]

export default function JournalPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showForm, setShowForm] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'neutral',
    tags: [],
    isPublic: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Charger les entrées de journal
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })

      if (!journalError && journalData) {
        setEntries(journalData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      alert('Écris quelque chose dans ton journal !')
      return
    }

    setSaving(true)

    try {
      const entryData = {
        user_id: user.id,
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        mood: formData.mood,
        tags: formData.tags,
        is_public: formData.isPublic,
        entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(entryData)
        .select()

      if (error) throw error

      // Si l'entrée est publique, créer un post forum automatiquement
      if (formData.isPublic && data && data[0]) {
        const { error: forumError } = await supabase
          .from('forum_posts')
          .insert({
            user_id: user.id,
            author_name: 'Anonyme',
            is_anonymous: true,
            category: 'journal',
            title: formData.title.trim() || `Journal du ${new Date().toLocaleDateString('fr-FR')}`,
            content: formData.content.trim(),
            mood: formData.mood,
            tags: formData.tags,
            journal_entry_id: data[0].id,
          })

        if (forumError) {
          console.error('Erreur lors de la création du post forum:', forumError)
        }
      }

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        content: '',
        mood: 'neutral',
        tags: [],
        isPublic: false
      })

      // Recharger les entrées
      await loadData()

      // Vérifier et débloquer les badges
      const newBadges = await checkAndUnlockBadges(user.id)

      // Afficher un message de succès avec badges débloqués
      if (newBadges && newBadges.length > 0) {
        const badgeNames = newBadges.map(b => `${b.emoji} ${b.name}`).join('\n')
        alert(`✅ Ton journal a été enregistré !\n\n🏆 Nouveaux badges débloqués:\n${badgeNames}`)
      } else {
        alert('✅ Ton journal a été enregistré !')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h1 className="text-lg font-semibold text-white">📓 Mon Journal</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Formulaire d'écriture */}
          {showForm && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">✍️ Nouvelle entrée</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-purple-300 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Titre optionnel */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Ma première semaine sans cigarettes"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Humeur */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-3">
                    Comment te sens-tu ?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(moodEmojis).map(([key, { emoji, label, color }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, mood: key })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.mood === key
                            ? `bg-gradient-to-br ${color} border-white/40 scale-105`
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">{emoji}</div>
                        <div className="text-xs text-white">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contenu */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Ton ressenti
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Écris librement ce que tu ressens, tes difficultés, tes victoires..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-3">
                    Tags (optionnel)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          formData.tags.includes(tag)
                            ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Partage public */}
                <div className="pt-4 border-t border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-purple-200 group-hover:text-white transition">
                        📓 Partager anonymement dans "Nos Journaux"
                      </span>
                      <p className="text-xs text-purple-400 mt-1">
                        Ton journal sera visible par la communauté pour inspirer et soutenir les autres
                      </p>
                    </div>
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des entrées */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {entries.length > 0 ? `Mes entrées (${entries.length})` : 'Aucune entrée pour le moment'}
            </h3>

            {entries.map((entry) => (
              <div
                key={entry.id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
              >
                {/* Header de l'entrée */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{moodEmojis[entry.mood]?.emoji || '😐'}</div>
                    <div>
                      {entry.title && (
                        <h4 className="text-lg font-semibold text-white mb-1">{entry.title}</h4>
                      )}
                      <p className="text-sm text-purple-300">{formatDate(entry.entry_date)}</p>
                    </div>
                  </div>
                  <div className="text-purple-300 hover:text-white transition">
                    {selectedEntry?.id === entry.id ? '▼' : '▶'}
                  </div>
                </div>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {entry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contenu (affiché si sélectionné) */}
                {selectedEntry?.id === entry.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  </div>
                )}

                {/* Aperçu (si pas sélectionné) */}
                {selectedEntry?.id !== entry.id && (
                  <p className="text-purple-200 line-clamp-2">{entry.content}</p>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>

      <BottomNav />
      <SOSButton />
    </div>
  )
}
