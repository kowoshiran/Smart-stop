'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

// Composant pour les étoiles animées
function StarField() {
  const [stars, setStars] = useState([])

  useEffect(() => {
    const newStars = []
    for (let i = 0; i < 40; i++) {
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

// Catégorie labels
const getCategoryLabel = (category) => {
  switch (category) {
    case 'reduction': return 'Réduction'
    case 'time': return 'Temporel'
    case 'period': return 'Par période'
    case 'spacing': return 'Espacement'
    case 'context': return 'Contextuel'
    default: return category
  }
}

const getDifficultyLabel = (difficulty) => {
  switch (difficulty) {
    case 'beginner': return '🌱 Débutant'
    case 'intermediate': return '🔥 Intermédiaire'
    case 'advanced': return '💪 Avancé'
    default: return difficulty
  }
}

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'beginner': return 'from-emerald-500/40 to-green-500/40 border-emerald-500/30'
    case 'intermediate': return 'from-amber-500/40 to-orange-500/40 border-amber-500/30'
    case 'advanced': return 'from-red-500/40 to-pink-500/40 border-red-500/30'
    default: return 'from-purple-500/40 to-cyan-500/40 border-purple-500/30'
  }
}

export default function DailyGoalsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [goalTemplates, setGoalTemplates] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setUser(user)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur profil:', profileError)
          return
        }

        setProfile(profileData)

        // Charger les objectifs disponibles selon le type de profil
        const { data: templates, error: templatesError } = await supabase
          .from('daily_goal_templates')
          .select('*')
          .or(`target_type.eq.${profileData.quit_type},target_type.eq.both`)
          .order('difficulty', { ascending: true })
          .order('points_reward', { ascending: true })

        if (templatesError) {
          console.error('Erreur templates:', templatesError)
        } else {
          setGoalTemplates(templates || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSelectGoal = async (goalId) => {
    try {
      setSaving(true)

      const today = new Date().toISOString().split('T')[0]

      // Mettre à jour le profil avec le nouvel objectif
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          current_daily_goal_id: goalId,
          daily_goal_started_at: new Date().toISOString(),
          daily_goal_completed_today: false,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Créer une entrée dans l'historique pour aujourd'hui
      const { error: historyError } = await supabase
        .from('daily_goal_history')
        .upsert({
          user_id: user.id,
          goal_template_id: goalId,
          goal_date: today,
          completed: false,
        }, {
          onConflict: 'user_id,goal_date'
        })

      if (historyError) throw historyError

      // Rediriger vers le dashboard
      router.push('/dashboard')

    } catch (error) {
      console.error('Erreur lors de la sélection:', error)
      alert('Erreur lors de la sélection de l\'objectif: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  // Filtrer les objectifs
  const filteredGoals = goalTemplates.filter(goal => {
    if (selectedCategory !== 'all' && goal.category !== selectedCategory) return false
    if (selectedDifficulty !== 'all' && goal.difficulty !== selectedDifficulty) return false
    return true
  })

  // Grouper par catégorie
  const categories = ['reduction', 'time', 'period', 'spacing', 'context']
  const groupedGoals = categories.reduce((acc, cat) => {
    acc[cat] = filteredGoals.filter(g => g.category === cat)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white pb-32">
      <StarField />

      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-[100px] opacity-30" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="text-purple-300 hover:text-white transition">
            ← Retour
          </Link>
          <h1 className="text-lg font-bold text-white">Objectifs du jour</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Introduction */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">🎯</div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Choisis ton objectif du jour</h2>
                <p className="text-purple-300 text-sm mb-3">
                  Sélectionne un objectif adapté à ton niveau pour progresser à ton rythme.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300">
                    🌱 = Accessible
                  </div>
                  <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300">
                    🔥 = Challenge
                  </div>
                  <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                    💪 = Expert
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {/* Filtre par difficulté */}
              <div>
                <label className="block text-purple-200 text-xs mb-2">Niveau</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Tous</option>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>

              {/* Filtre par catégorie */}
              <div>
                <label className="block text-purple-200 text-xs mb-2">Catégorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Toutes</option>
                  <option value="reduction">Réduction</option>
                  <option value="time">Temporel</option>
                  <option value="period">Par période</option>
                  <option value="spacing">Espacement</option>
                  <option value="context">Contextuel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des objectifs par catégorie */}
          {categories.map(category => {
            const goalsInCategory = groupedGoals[category]
            if (!goalsInCategory || goalsInCategory.length === 0) return null

            return (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  {getCategoryLabel(category)}
                  <span className="text-purple-300 text-sm font-normal">({goalsInCategory.length})</span>
                </h3>

                <div className="space-y-3">
                  {goalsInCategory.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => handleSelectGoal(goal.id)}
                      disabled={saving}
                      className={`w-full backdrop-blur-xl bg-gradient-to-br ${getDifficultyColor(goal.difficulty)} border rounded-2xl p-5 text-left hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{goal.icon || '🎯'}</div>
                          <div>
                            <h4 className="text-base font-bold text-white mb-1">{goal.title}</h4>
                            <p className="text-purple-200 text-sm">{goal.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-300">{getDifficultyLabel(goal.difficulty)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-sm font-semibold">+{goal.points_reward} pts</span>
                          <div className="text-white text-lg">→</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredGoals.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-purple-300">Aucun objectif ne correspond à tes filtres</p>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  )
}
