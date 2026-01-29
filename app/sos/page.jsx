'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function SOSPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white">
      <StarField />

      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-[100px] opacity-30 animate-pulse" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30 animate-pulse" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg">
              🌿
            </div>
            <span className="text-lg font-bold text-white">Smart Stop</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">🚨 SOS</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4 pb-24">
        <div className="max-w-2xl mx-auto">

          {/* Message d'urgence */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-2xl p-8 mb-8 text-center animate-pulse">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-3xl font-bold text-white mb-3">Tu as une envie forte ?</h2>
            <p className="text-xl text-red-200 mb-2">Respire profondément</p>
            <p className="text-lg text-orange-200">Les envies durent maximum 5 minutes</p>
            <p className="text-lg text-orange-200 font-bold mt-2">Tu peux tenir ! 💪</p>
          </div>

          {/* Options d'aide */}
          <div className="space-y-6">

            {/* Option 1: Demander de l'aide */}
            <Link
              href="/forum"
              onClick={() => {
                // On peut stocker la catégorie "support" pour ouvrir directement
                localStorage.setItem('forum_category', 'support')
              }}
              className="block"
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group relative overflow-hidden">
                {/* Gradient de fond */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                {/* Barre colorée */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-purple-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-3xl">
                      🤝
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-400 transition">
                        Demande de l'aide à la communauté
                      </h3>
                      <p className="text-purple-300">
                        Partage ton moment difficile et reçois du soutien
                      </p>
                    </div>
                    <div className="text-3xl group-hover:translate-x-2 transition-transform">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Option 2: Jeu de distraction */}
            <Link
              href="/sos/game"
              className="block"
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group relative overflow-hidden">
                {/* Gradient de fond */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                {/* Barre colorée */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl">
                      🎮
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-400 transition">
                        Casse l'envie avec un jeu
                      </h3>
                      <p className="text-purple-300">
                        Distrait-toi pendant 5 minutes avec le jeu de bulles
                      </p>
                    </div>
                    <div className="text-3xl group-hover:translate-x-2 transition-transform">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>

          {/* Message de motivation */}
          <div className="mt-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-lg text-purple-200 mb-2">
              "L'envie est comme une vague, elle monte puis redescend."
            </p>
            <p className="text-sm text-purple-400">
              Reste fort, la communauté est avec toi ! 💜
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
