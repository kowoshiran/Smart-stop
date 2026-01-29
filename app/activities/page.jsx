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

// Modal de détail d'une carte avec flip
function ExerciseCardModal({ card, onClose, onStartSession }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal')

  if (!card) return null

  const difficulties = [
    { value: 'easy', label: 'Facile', emoji: '😌', color: 'from-green-500 to-emerald-500' },
    { value: 'normal', label: 'Normal', emoji: '💪', color: 'from-blue-500 to-cyan-500' },
    { value: 'hard', label: 'Difficile', emoji: '🔥', color: 'from-orange-500 to-red-500' },
  ]

  const getCurrentInstructions = () => {
    if (selectedDifficulty === 'easy' && card.easy_variant) return card.easy_variant
    if (selectedDifficulty === 'hard' && card.hard_variant) return card.hard_variant
    return card.normal_variant || card.verso_instructions
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Carte avec effet flip */}
        <div className={`relative transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* Recto */}
          <div className={`backdrop-blur-xl bg-gradient-to-br ${card.color_code} border border-white/20 rounded-3xl p-8 ${isFlipped ? 'hidden' : 'block'}`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white text-xl"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {card.category === 'cardio' && '🏃'}
                {card.category === 'strength' && '💪'}
                {card.category === 'flexibility' && '🧘'}
                {card.category === 'yoga' && '🕉️'}
                {card.category === 'meditation' && '🧘‍♀️'}
                {card.category === 'breathing' && '🫁'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{card.title}</h2>
              <p className="text-white/80 text-lg">{card.description || card.recto_description}</p>
            </div>

            {/* Infos */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="backdrop-blur-xl bg-white/20 rounded-xl px-4 py-2">
                <div className="text-white/80 text-xs">Durée</div>
                <div className="text-white font-bold">{card.duration_minutes} min</div>
              </div>
              {card.calories_burn_estimate && (
                <div className="backdrop-blur-xl bg-white/20 rounded-xl px-4 py-2">
                  <div className="text-white/80 text-xs">Calories</div>
                  <div className="text-white font-bold">~{card.calories_burn_estimate}</div>
                </div>
              )}
            </div>

            {/* Bénéfices */}
            {card.benefits && card.benefits.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">✨ Bénéfices</h3>
                <div className="flex flex-wrap gap-2">
                  {card.benefits.map((benefit, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsFlipped(true)}
              className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <span>Voir les instructions</span>
              <span className="text-xl">🔄</span>
            </button>
          </div>

          {/* Verso */}
          <div className={`backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 ${isFlipped ? 'block' : 'hidden'}`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white text-xl"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-white mb-4">📋 Instructions</h3>

            {/* Sélection de la difficulté */}
            <div className="mb-6">
              <label className="block text-purple-200 text-sm mb-3">Choisis ton niveau</label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((diff) => (
                  <button
                    key={diff.value}
                    onClick={() => setSelectedDifficulty(diff.value)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedDifficulty === diff.value
                        ? `bg-gradient-to-br ${diff.color} border-white/40 scale-105`
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{diff.emoji}</div>
                    <div className="text-white text-sm font-semibold">{diff.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <p className="text-white whitespace-pre-wrap leading-relaxed">
                {getCurrentInstructions()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsFlipped(false)}
                className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
              >
                🔄 Retour
              </button>
              <button
                onClick={() => onStartSession(card, selectedDifficulty)}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold transition"
              >
                ▶️ Commencer
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// Modal de session active avec timer
function SessionTimerModal({ card, difficulty, onComplete, onCancel }) {
  const [timeRemaining, setTimeRemaining] = useState(card.duration_minutes * 60) // en secondes
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((card.duration_minutes * 60 - timeRemaining) / (card.duration_minutes * 60)) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="max-w-md w-full backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/20 rounded-3xl p-8 text-center">

        <div className="text-6xl mb-4">
          {card.category === 'cardio' && '🏃'}
          {card.category === 'strength' && '💪'}
          {card.category === 'flexibility' && '🧘'}
          {card.category === 'yoga' && '🕉️'}
          {card.category === 'meditation' && '🧘‍♀️'}
          {card.category === 'breathing' && '🫁'}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
        <p className="text-purple-300 mb-6">Niveau : {difficulty === 'easy' ? 'Facile 😌' : difficulty === 'hard' ? 'Difficile 🔥' : 'Normal 💪'}</p>

        {/* Timer circulaire */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="transform -rotate-90" width="192" height="192">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl font-bold text-white">{formatTime(timeRemaining)}</div>
          </div>
        </div>

        {/* Message de motivation */}
        <p className="text-cyan-300 text-lg mb-6 animate-pulse">
          {timeRemaining === 0 ? '🎉 Bravo ! Séance terminée !' : 'Continue, tu assures ! 💪'}
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          {timeRemaining > 0 ? (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
              >
                {isPaused ? '▶️ Reprendre' : '⏸️ Pause'}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white font-semibold transition border border-red-500/30"
              >
                ❌ Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => onComplete(card, difficulty)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition text-lg"
            >
              ✅ Terminer la séance
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ActivitiesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCard, setSelectedCard] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [todayStats, setTodayStats] = useState({ sessions: 0, minutes: 0 })

  const categories = [
    { value: 'all', label: 'Tous', emoji: '🌟' },
    { value: 'fitness', label: 'Fitness', emoji: '💪' },
    { value: 'yoga', label: 'Yoga', emoji: '🧘' },
    { value: 'meditation', label: 'Méditation', emoji: '🧠' },
  ]

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

      // Charger les cartes
      const { data: cardsData, error: cardsError } = await supabase
        .from('exercise_cards')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (!cardsError && cardsData) {
        setCards(cardsData)
      }

      // Charger les stats du jour
      const today = new Date().toISOString().split('T')[0]
      const { data: sessionsData } = await supabase
        .from('user_exercise_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('session_date', today)

      if (sessionsData) {
        const totalMinutes = sessionsData.reduce((sum, s) => sum + s.duration_minutes, 0)
        setTodayStats({ sessions: sessionsData.length, minutes: totalMinutes })
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const handleStartSession = (card, difficulty) => {
    setSelectedCard(null)
    setActiveSession({ card, difficulty })
  }

  const handleCompleteSession = async (card, difficulty) => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Enregistrer la session
      const { error } = await supabase
        .from('user_exercise_sessions')
        .insert({
          user_id: user.id,
          card_id: card.id,
          difficulty_level: difficulty,
          duration_minutes: card.duration_minutes,
          session_date: today,
          completed: true
        })

      if (error) throw error

      alert(`🎉 Bravo ! Séance terminée !\n\n+${card.duration_minutes} minutes d'activité ajoutées à ton tracker.`)

      setActiveSession(null)
      await loadData()
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de l\'enregistrement de la séance')
    }
  }

  const filteredCards = selectedCategory === 'all'
    ? cards
    : cards.filter(c => c.category === selectedCategory)

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
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-[100px] opacity-30 animate-pulse" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-[100px] opacity-30 animate-pulse" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg">
              🌿
            </div>
            <span className="text-lg font-bold text-white">Smart Stop</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">🏃 Bouge & Respire</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Stats du jour */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">📊 Aujourd'hui</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">{todayStats.sessions}</div>
                <div className="text-emerald-300 text-sm">séance{todayStats.sessions > 1 ? 's' : ''}</div>
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{todayStats.minutes}</div>
                <div className="text-purple-300 text-sm">minutes</div>
              </div>
            </div>
          </div>

          {/* Filtres par catégorie */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedCategory === cat.value
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white scale-105'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="text-sm font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grille de cartes */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {filteredCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`backdrop-blur-xl bg-gradient-to-br ${card.color_code} border border-white/20 rounded-2xl p-5 hover:scale-105 transition-all group`}
              >
                <div className="text-4xl mb-3">
                  {card.category === 'fitness' && '💪'}
                  {card.category === 'yoga' && '🧘'}
                  {card.category === 'meditation' && '🧠'}
                </div>
                <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">{card.title}</h3>
                <div className="text-white/80 text-xs">{card.duration_minutes} min</div>
              </button>
            ))}
          </div>

          {/* Message si pas de cartes */}
          {filteredCards.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🏃</div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun exercice dans cette catégorie</h3>
              <p className="text-purple-300">Les cartes arrivent bientôt !</p>
            </div>
          )}

          {/* Lien pour ajouter des cartes (admin) */}
          {/* Info structure */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-3">📊 Structure des cartes</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10</div>
                <div className="text-xs text-purple-300">Méditation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">27</div>
                <div className="text-xs text-purple-300">Yoga</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">19</div>
                <div className="text-xs text-purple-300">Fitness</div>
              </div>
            </div>
            <p className="text-center text-purple-300 text-sm mb-4">Total : 56 cartes</p>

            <Link
              href="/activities/manage"
              className="block text-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition"
            >
              👨‍💼 Gérer les cartes
            </Link>
          </div>

        </div>
      </main>

      <BottomNav />
      <SOSButton />

      {/* Modals */}
      {selectedCard && (
        <ExerciseCardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onStartSession={handleStartSession}
        />
      )}

      {activeSession && (
        <SessionTimerModal
          card={activeSession.card}
          difficulty={activeSession.difficulty}
          onComplete={handleCompleteSession}
          onCancel={() => setActiveSession(null)}
        />
      )}
    </div>
  )
}
