'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function CommunityPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
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

  const topics = [
    {
      id: 'presentations',
      title: 'Présentation',
      icon: '👋',
      description: 'Présente-toi à la communauté',
      color: 'from-purple-600/30 to-pink-600/30',
      borderColor: 'border-purple-500/40',
      posts: 0,
    },
    {
      id: 'motivation',
      title: 'Motivation & Soutien',
      icon: '💪',
      description: 'Partage tes réussites et encourage les autres',
      color: 'from-emerald-600/30 to-teal-600/30',
      borderColor: 'border-emerald-500/40',
      posts: 0,
    },
    {
      id: 'conseils',
      title: 'Conseils & Astuces',
      icon: '💡',
      description: 'Échange tes meilleures techniques',
      color: 'from-amber-600/30 to-orange-600/30',
      borderColor: 'border-amber-500/40',
      posts: 0,
    },
  ]

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
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span>👥</span>
            Communauté
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Welcome Message */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">🌟</div>
              <div>
                <h2 className="text-xl font-bold text-white">Bienvenue dans la communauté</h2>
                <p className="text-purple-200 text-sm">Un espace bienveillant pour s'entraider</p>
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <p className="text-purple-100 text-sm">
                💬 Partage ton parcours, tes victoires et tes difficultés. Tu n'es pas seul(e) dans cette aventure !
              </p>
            </div>
          </div>

          {/* Topics Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Topics du forum</h3>

            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/community/${topic.id}`}
                className={`block backdrop-blur-xl bg-gradient-to-br ${topic.color} border ${topic.borderColor} rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.25)]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{topic.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{topic.title}</h4>
                      <p className="text-purple-200 text-sm">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-2xl text-white font-bold">{topic.posts}</div>
                    <div className="text-purple-300 text-xs">messages</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Règles de la communauté */}
          <div className="mt-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>📋</span>
              Règles de la communauté
            </h3>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Sois respectueux et bienveillant envers tous les membres</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Partage ton expérience personnelle de manière constructive</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Encourage et soutiens les autres dans leur parcours</span>
              </li>
              <li className="flex items-start gap-2">
                <span>❌</span>
                <span>Pas de jugement, de moquerie ou de propos négatifs</span>
              </li>
              <li className="flex items-start gap-2">
                <span>❌</span>
                <span>Pas de spam ou de contenu inapproprié</span>
              </li>
            </ul>
          </div>

        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
