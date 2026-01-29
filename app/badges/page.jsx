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

const tierColors = {
  bronze: 'from-orange-600 to-yellow-600',
  silver: 'from-gray-400 to-gray-200',
  gold: 'from-yellow-500 to-yellow-300',
  diamond: 'from-cyan-400 to-purple-500',
}

const tierGlow = {
  bronze: 'shadow-orange-500/50',
  silver: 'shadow-gray-400/50',
  gold: 'shadow-yellow-400/50',
  diamond: 'shadow-purple-500/50',
}

const categoryLabels = {
  milestone: 'Jalons',
  reduction: 'Réduction',
  action: 'Actions',
}

function BadgeCard({ badge, isUnlocked, unlockedAt }) {
  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 ${
        isUnlocked
          ? 'bg-white/10 border-white/20 hover:scale-105 hover:shadow-xl ' + tierGlow[badge.tier]
          : 'bg-white/5 border-white/10 opacity-60 grayscale'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Badge emoji */}
        <div
          className={`text-6xl mb-4 transition-all duration-500 ${
            isUnlocked ? 'scale-100 animate-pulse' : 'scale-90'
          }`}
        >
          {isUnlocked ? badge.emoji : '🔒'}
        </div>

        {/* Tier badge */}
        {badge.tier && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold mb-2 bg-gradient-to-r ${
              isUnlocked ? tierColors[badge.tier] : 'from-gray-600 to-gray-500'
            } text-white`}
          >
            {badge.tier.toUpperCase()}
          </div>
        )}

        {/* Badge name */}
        <h3 className="text-lg font-bold text-white mb-2">{badge.name}</h3>

        {/* Badge description */}
        <p className="text-sm text-purple-300 mb-3">{badge.description}</p>

        {/* Points */}
        <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
          <span>⭐</span>
          <span>+{badge.points} pts</span>
        </div>

        {/* Unlocked date */}
        {isUnlocked && unlockedAt && (
          <div className="mt-3 text-xs text-cyan-300">
            Débloqué le {new Date(unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BadgesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState([])
  const [userBadges, setUserBadges] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')

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

      // Charger tous les badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('order_index', { ascending: true })

      if (badgesError) {
        console.error('Erreur badges:', badgesError)
      } else {
        setBadges(badgesData || [])
      }

      // Charger les badges de l'utilisateur
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', user.id)

      if (userBadgesError) {
        console.error('Erreur user badges:', userBadgesError)
      } else {
        setUserBadges(userBadgesData || [])
      }

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

  // Filtrer les badges selon la catégorie
  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(b => b.category === selectedCategory)

  // Grouper par catégorie
  const badgesByCategory = {}
  filteredBadges.forEach(badge => {
    if (!badgesByCategory[badge.category]) {
      badgesByCategory[badge.category] = []
    }
    badgesByCategory[badge.category].push(badge)
  })

  // Calculer les stats
  const unlockedCount = userBadges.length
  const totalCount = badges.length
  const totalPoints = userBadges.reduce((sum, ub) => sum + (ub.badge?.points || 0), 0)
  const progress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

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
          <h1 className="text-lg font-semibold text-white">🏆 Badges</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Stats en-tête */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{unlockedCount}</div>
                <div className="text-xs text-purple-300">Débloqués</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">{totalPoints}</div>
                <div className="text-xs text-purple-300">Points totaux</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{progress}%</div>
                <div className="text-xs text-purple-300">Progression</div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold"
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && <span>{unlockedCount}/{totalCount}</span>}
              </div>
            </div>
          </div>

          {/* Filtres par catégorie */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                    : 'bg-white/10 text-purple-200 hover:bg-white/20'
                }`}
              >
                Tous
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === key
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Affichage des badges par catégorie */}
          {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">
                  {category === 'milestone' && '🎯'}
                  {category === 'reduction' && '📉'}
                  {category === 'action' && '⚡'}
                </span>
                {categoryLabels[category]}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {categoryBadges.map((badge) => {
                  const userBadge = userBadges.find(ub => ub.badge_id === badge.id)
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isUnlocked={!!userBadge}
                      unlockedAt={userBadge?.unlocked_at}
                    />
                  )
                })}
              </div>
            </div>
          ))}

          {/* Message si aucun badge */}
          {filteredBadges.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun badge dans cette catégorie</h3>
              <p className="text-purple-300">Essaie une autre catégorie !</p>
            </div>
          )}

        </div>
      </main>

      <BottomNav />
      <SOSButton />
    </div>
  )
}
