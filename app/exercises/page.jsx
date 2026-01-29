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

export default function ExercisesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        router.push('/login')
      }
    }

    loadUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  const categories = [
    {
      id: 'meditation',
      name: 'Méditation',
      icon: '🧘',
      description: 'Retrouve ton calme intérieur avec 10 méditations guidées',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      count: '10 cartes',
      unlockText: 'Déverrouillage progressif'
    },
    {
      id: 'yoga',
      name: 'Yoga',
      icon: '🧘‍♀️',
      description: 'Étire et renforce ton corps avec 26 postures de yoga',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      count: '26 cartes',
      unlockText: '3 niveaux de difficulté'
    },
    {
      id: 'fitness',
      name: 'Fitness',
      icon: '💪',
      description: 'Tonifie ton corps avec 19 exercices de renforcement',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      count: '19 cartes',
      unlockText: '3 niveaux de difficulté'
    }
  ]

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
          <h1 className="text-lg font-bold text-white">Exercices</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-xl mx-auto">

          {/* Introduction */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏃</div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Cartes d'exercices
            </h2>
            <p className="text-purple-300 text-base">
              Remplace ta cigarette par une activité saine
            </p>
          </div>

          {/* Catégories */}
          <div className="space-y-4 mb-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/exercises/${category.id}`}
                className="block"
              >
                <div className={`backdrop-blur-xl ${category.bgColor} border ${category.borderColor} rounded-2xl p-6 hover:scale-[1.02] transition-all cursor-pointer`}>
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className="flex-shrink-0">
                      <div className="text-5xl">{category.icon}</div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {category.name}
                      </h3>
                      <p className="text-purple-200 text-sm mb-3">
                        {category.description}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-purple-200">
                          {category.count}
                        </span>
                        <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-purple-200">
                          {category.unlockText}
                        </span>
                      </div>
                    </div>

                    {/* Flèche */}
                    <div className="flex-shrink-0 text-purple-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info box */}
          <div className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Comment ça marche ?</h3>
                <p className="text-purple-200 text-sm leading-relaxed">
                  Choisis une catégorie, sélectionne les cartes qui t'intéressent, puis crée une séance personnalisée.
                  Le temps passé sera automatiquement ajouté à ton tracker quotidien !
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <BottomNav />
      <SOSButton />
    </div>
  )
}
