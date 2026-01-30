'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { checkAndUnlockBadges } from '@/Lib/badgeUtils'

function SessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cardIds = searchParams.get('cards')?.split(',') || []

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Vérifier l'utilisateur
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Vérifier qu'on a bien des IDs
        if (!cardIds || cardIds.length === 0) {
          console.error('Aucun ID de carte fourni')
          setLoading(false)
          return
        }

        // Récupérer les cartes sélectionnées
        const { data: cardsData, error: cardsError } = await supabase
          .from('exercise_cards')
          .select('*')
          .in('id', cardIds)

        if (cardsError) {
          console.error('Erreur lors du chargement des cartes:', cardsError)
          alert('Erreur lors du chargement des cartes: ' + cardsError.message)
          setLoading(false)
          return
        }

        setCards(cardsData || [])

        // Initialiser le timer avec la première carte
        if (cardsData && cardsData.length > 0) {
          setTimeRemaining((cardsData[0].duration_minutes || 5) * 60)
          setSessionStartTime(Date.now())
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        alert('Erreur: ' + error.message)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Timer
  useEffect(() => {
    let interval = null

    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            // Passer automatiquement à la carte suivante
            setTimeout(() => nextCard(), 1000)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timeRemaining])

  const startTimer = () => {
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      // Calculer le temps passé sur cette carte
      const cardDuration = (cards[currentCardIndex].duration_minutes || 5) * 60
      const timeSpent = cardDuration - timeRemaining
      setTotalTimeSpent(prev => prev + Math.max(timeSpent, 0))

      // Passer à la carte suivante
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
      setIsTimerRunning(false)
      setTimeRemaining((cards[currentCardIndex + 1].duration_minutes || 5) * 60)
    } else {
      // Fin de la séance
      endSession()
    }
  }

  const endSession = async () => {
    try {
      // Calculer le temps total passé
      const cardDuration = (cards[currentCardIndex].duration_minutes || 5) * 60
      const timeSpent = cardDuration - timeRemaining
      const finalTotalTime = totalTimeSpent + Math.max(timeSpent, 0)
      const totalMinutes = Math.round(finalTotalTime / 60)

      // Déterminer le type d'activité
      const category = cards[0]?.category
      const isMeditation = category === 'meditation'
      const isPhysical = category === 'yoga' || category === 'fitness'

      // Récupérer l'entrée du jour
      const today = new Date().toISOString().split('T')[0]
      const { data: todayEntry, error: fetchError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération de l\'entrée:', fetchError)
      }

      // Préparer les données à mettre à jour
      const updateData = {
        user_id: user.id,
        entry_date: today,
        updated_at: new Date().toISOString(),
      }

      if (isMeditation) {
        updateData.meditation_minutes = (todayEntry?.meditation_minutes || 0) + totalMinutes
      }

      if (isPhysical) {
        updateData.physical_activity_minutes = (todayEntry?.physical_activity_minutes || 0) + totalMinutes
      }

      // Si l'entrée n'existe pas, ajouter les champs obligatoires
      if (!todayEntry) {
        updateData.tracking_type = 'cigarettes'
        updateData.cigarettes_count = 0
        updateData.mood = 'neutral'
        updateData.energy_level = 3
        updateData.triggers = []
        updateData.money_saved = 0
        if (!isMeditation) updateData.meditation_minutes = 0
        if (!isPhysical) updateData.physical_activity_minutes = 0
      }

      // Mettre à jour ou créer l'entrée
      const { error: upsertError } = await supabase
        .from('daily_entries')
        .upsert(updateData, { onConflict: 'user_id,entry_date' })

      if (upsertError) {
        console.error('Erreur lors de la mise à jour:', upsertError)
        throw upsertError
      }

      // Vérifier et débloquer les badges
      const newBadges = await checkAndUnlockBadges(user.id)

      // Message de succès
      let message = `🎉 Séance terminée !\n\n✅ ${totalMinutes} minutes ajoutées à ton tracker`

      if (newBadges && newBadges.length > 0) {
        const badgeNames = newBadges.map(b => `${b.emoji} ${b.name}`).join('\n')
        message += `\n\n🏆 Nouveaux badges:\n${badgeNames}`
      }

      alert(message)

      // Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde de ta séance')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-400 mb-4">Aucune carte sélectionnée</div>
          <button
            onClick={() => router.push('/exercises')}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl"
          >
            Retour aux exercices
          </button>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentCardIndex]
  const progress = ((currentCardIndex + 1) / cards.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white">
      {/* Header avec progression */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => {
                if (confirm('Quitter la séance ? Ta progression ne sera pas sauvegardée.')) {
                  router.push('/exercises')
                }
              }}
              className="text-purple-300 hover:text-white transition"
            >
              ✕ Quitter
            </button>
            <div className="text-white text-sm font-semibold">
              Carte {currentCardIndex + 1} / {cards.length}
            </div>
            <button
              onClick={endSession}
              className="text-purple-300 hover:text-white transition text-sm"
            >
              Terminer
            </button>
          </div>
          {/* Barre de progression */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4 min-h-screen flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">

          {/* Timer */}
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-white mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-purple-300 text-sm">
              {isTimerRunning ? 'En cours...' : 'Prêt à commencer'}
            </div>
          </div>

          {/* Carte avec effet flip */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <div
              className="relative w-full max-w-md aspect-[3/4] cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-700`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Recto */}
                <div
                  className="absolute w-full h-full rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {currentCard.recto_image_url ? (
                    <img
                      src={currentCard.recto_image_url}
                      alt={currentCard.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center">
                      <div className="text-8xl">🧘</div>
                    </div>
                  )}
                </div>

                {/* Verso */}
                <div
                  className="absolute w-full h-full rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {currentCard.verso_image_url ? (
                    <img
                      src={currentCard.verso_image_url}
                      alt={`${currentCard.title} - Verso`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-purple-900 flex items-center justify-center p-6 overflow-auto">
                      <div className="text-white text-sm">
                        {currentCard.verso_instructions || 'Instructions non disponibles'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Indication flip */}
          <div className="text-center mb-6">
            <div className="text-purple-300 text-sm">
              👆 Clique sur la carte pour voir le {isFlipped ? 'recto' : 'verso'}
            </div>
          </div>

          {/* Contrôles */}
          <div className="space-y-3">
            {/* Bouton Play/Pause */}
            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:scale-105 transition"
              >
                ▶️ Commencer
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:scale-105 transition"
              >
                ⏸️ Pause
              </button>
            )}

            {/* Bouton Suivant */}
            <button
              onClick={nextCard}
              className="w-full py-3 bg-white/5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition"
            >
              {currentCardIndex < cards.length - 1 ? '⏭️ Carte suivante' : '🎉 Terminer la séance'}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  )
}
