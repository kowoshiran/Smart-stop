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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    quit_goal: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
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
        setFormData({
          first_name: profileData.first_name || '',
          quit_goal: profileData.quit_goal || '',
        })

        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSave = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          quit_goal: formData.quit_goal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Recharger le profil
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(updatedProfile)
      setIsEditing(false)
      alert('✅ Profil mis à jour !')

      setSaving(false)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
      setSaving(false)
    }
  }

  const getQuitTypeLabel = (type) => {
    switch(type) {
      case 'cigarettes': return '🚬 Cigarettes'
      case 'vape': return '💨 Vape'
      case 'both': return '🚬💨 Les deux'
      default: return type
    }
  }

  const getLevelLabel = (level) => {
    switch(level) {
      case 'beginner': return '🌱 Débutant'
      case 'explorer': return '🔍 Explorateur'
      case 'champion': return '🏆 Champion'
      case 'master': return '👑 Maître'
      default: return level || 'Débutant'
    }
  }

  const getVapeFrequencyLabel = (frequency) => {
    switch(frequency) {
      case 'light': return 'Légère'
      case 'moderate': return 'Modérée'
      case 'heavy': return 'Élevée'
      default: return frequency || 'Non défini'
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
          <h1 className="text-lg font-bold text-white">Mon Profil</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-xl mx-auto">

          {/* Avatar et nom */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
              {profile?.first_name?.[0]?.toUpperCase() || '👤'}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="text-2xl font-bold text-white bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center"
                placeholder="Ton prénom"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile?.first_name || 'Utilisateur'}
              </h2>
            )}
            <p className="text-purple-300 text-sm">{user?.email}</p>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-lg font-bold text-white">{profile?.points || 0}</div>
              <div className="text-purple-300 text-xs">Points</div>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-lg font-bold text-white">{getLevelLabel(profile?.level)}</div>
              <div className="text-purple-300 text-xs">Niveau</div>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">📅</div>
              <div className="text-lg font-bold text-white">
                {profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className="text-purple-300 text-xs">Jours</div>
            </div>
          </div>

          {/* Informations du profil */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Informations</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-lg text-sm hover:bg-purple-500/30 transition"
                >
                  ✏️ Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        first_name: profile.first_name || '',
                        quit_goal: profile.quit_goal || '',
                      })
                      setIsEditing(false)
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/20 text-purple-200 rounded-lg text-sm hover:bg-white/10 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-cyan-600 transition disabled:opacity-50"
                  >
                    {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Type de sevrage */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">Type de sevrage</label>
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                  {getQuitTypeLabel(profile?.quit_type)}
                </div>
              </div>

              {/* Baseline */}
              {profile?.quit_type === 'cigarettes' && (
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Baseline</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    {profile?.cigarettes_per_day_baseline || 0} cigarettes/jour
                  </div>
                </div>
              )}

              {profile?.quit_type === 'vape' && (
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Fréquence vape</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    {getVapeFrequencyLabel(profile?.vape_frequency_baseline)}
                  </div>
                </div>
              )}

              {/* Objectif */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">Mon objectif</label>
                {isEditing ? (
                  <textarea
                    value={formData.quit_goal}
                    onChange={(e) => setFormData({ ...formData, quit_goal: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white resize-none"
                    rows="3"
                    placeholder="Ex: Arrêter complètement dans 3 mois..."
                  />
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    {profile?.quit_goal || 'Aucun objectif défini'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Autres informations */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4">Paramètres du compte</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-purple-200">Email</span>
                <span className="text-white text-sm">{user?.email}</span>
              </div>
              <div className="border-t border-white/10"></div>
              <div className="flex items-center justify-between py-2">
                <span className="text-purple-200">Membre depuis</span>
                <span className="text-white text-sm">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-4">Zone de danger</h3>
            <p className="text-red-200 text-sm mb-4">
              La suppression de ton compte est irréversible. Toutes tes données seront perdues.
            </p>
            <button
              onClick={() => {
                if (confirm('Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.')) {
                  alert('Fonctionnalité de suppression de compte à venir')
                }
              }}
              className="w-full py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition"
            >
              🗑️ Supprimer mon compte
            </button>
          </div>

        </div>
      </main>

      <BottomNav />
      <SOSButton />
    </div>
  )
}
