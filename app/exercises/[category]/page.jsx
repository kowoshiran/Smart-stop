'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import SOSButton from '@/components/SOSButton'

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

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const category = params.category

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [selectedCards, setSelectedCards] = useState([])

  const categoryInfo = {
    meditation: {
      name: 'Méditation',
      icon: '🧘',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    yoga: {
      name: 'Yoga',
      icon: '🧘‍♀️',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    fitness: {
      name: 'Fitness',
      icon: '💪',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
  }

  const info = categoryInfo[category]

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

        // Récupérer les cartes de la catégorie
        let query = supabase
          .from('exercise_cards')
          .select('*')
          .eq('category', category)

        // Pour la méditation, trier par unlock_order
        if (category === 'meditation') {
          query = query.order('unlock_order', { ascending: true })
        } else {
          query = query.order('title', { ascending: true })
        }

        const { data: cardsData, error: cardsError } = await query

        if (cardsError) {
          console.error('Erreur lors du chargement des cartes:', cardsError)
          return
        }

        setCards(cardsData || [])
        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router, category])

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }

  const startSession = () => {
    if (selectedCards.length === 0) {
      alert('Sélectionne au moins une carte pour créer une séance !')
      return
    }

    // Rediriger vers la page de séance avec les cartes sélectionnées
    const cardIds = selectedCards.join(',')
    router.push(`/exercises/session?cards=${cardIds}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-red-400">Catégorie non trouvée</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white pb-32">
      <StarField />

      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-[100px] opacity-30" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/exercises" className="text-purple-300 hover:text-white transition">
            ← Retour
          </Link>
          <h1 className="text-lg font-bold text-white">{info.name}</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-xl mx-auto">

          {/* Header catégorie */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{info.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {cards.length} cartes disponibles
            </h2>
            <p className="text-purple-300 text-sm">
              Sélectionne les cartes pour ta séance
            </p>
          </div>

          {/* Sélection rapide */}
          {selectedCards.length > 0 && (
            <div className={`backdrop-blur-xl ${info.bgColor} border ${info.borderColor} rounded-2xl p-4 mb-4 flex items-center justify-between`}>
              <div>
                <div className="text-white font-semibold">
                  {selectedCards.length} carte{selectedCards.length > 1 ? 's' : ''} sélectionnée{selectedCards.length > 1 ? 's' : ''}
                </div>
                <div className="text-purple-200 text-xs">
                  Durée totale: {cards.filter(c => selectedCards.includes(c.id)).reduce((sum, c) => sum + (c.duration_minutes || 5), 0)} min
                </div>
              </div>
              <button
                onClick={startSession}
                className={`px-6 py-2 bg-gradient-to-r ${info.color} text-white rounded-xl font-semibold hover:scale-105 transition`}
              >
                Démarrer
              </button>
            </div>
          )}

          {/* Grille de cartes */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {cards.map((card) => {
              const isSelected = selectedCards.includes(card.id)

              return (
                <div
                  key={card.id}
                  onClick={() => toggleCardSelection(card.id)}
                  className={`backdrop-blur-xl bg-white/5 border ${
                    isSelected ? `${info.borderColor} border-2` : 'border-white/10'
                  } rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all`}
                >
                  {/* Image de la carte */}
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-900/20 to-cyan-900/20">
                    {card.recto_image_url ? (
                      <img
                        src={card.recto_image_url}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">{info.icon}</span>
                      </div>
                    )}

                    {/* Badge sélection */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">✓</span>
                      </div>
                    )}

                    {/* Badge unlock order pour méditation */}
                    {category === 'meditation' && card.unlock_order && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-semibold">
                        #{card.unlock_order}
                      </div>
                    )}
                  </div>

                  {/* Info carte */}
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                      {card.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-purple-300">
                      <span>⏱️ {card.duration_minutes || 5} min</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bouton fixe si des cartes sont sélectionnées */}
          {selectedCards.length > 0 && (
            <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
              <div className="max-w-xl mx-auto">
                <button
                  onClick={startSession}
                  className={`w-full py-4 bg-gradient-to-r ${info.color} text-white rounded-xl font-bold text-lg hover:scale-105 transition shadow-2xl`}
                >
                  🎯 Démarrer la séance ({selectedCards.length} carte{selectedCards.length > 1 ? 's' : ''})
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
      <SOSButton />
    </div>
  )
}
