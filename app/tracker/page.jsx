'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { checkAndUnlockBadges } from '@/Lib/badgeUtils'
import { checkAndValidateDailyGoal } from '@/Lib/dailyGoalUtils'
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

export default function TrackerPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [todayEntry, setTodayEntry] = useState(null)

  // Données du formulaire
  const [formData, setFormData] = useState({
    trackingType: 'cigarettes', // L'utilisateur choisit cigarettes ou vape
    cigarettesCount: 0,
    vapePuffs: 0,
    mood: 'neutral',
    energyLevel: 3,
    physicalActivityMinutes: 0,
    meditationMinutes: 0,
    triggers: [],
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const loadData = async () => {
      try {
        // Récupérer l'utilisateur
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('quit_type, cigarettes_per_day_baseline, vape_frequency_baseline')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur profil:', profileError)
          return
        }
        setProfile(profileData)

        // Définir le trackingType par défaut selon le profil
        const defaultType = profileData.quit_type === 'both' ? 'both' : (profileData.quit_type === 'vape' ? 'vape' : 'cigarettes')

        // Récupérer l'entrée du jour si elle existe
        try {
          const { data: entryData, error: entryError } = await supabase
            .from('daily_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('entry_date', today)
            .single()

          if (entryData && !entryError) {
            // Pré-remplir le formulaire avec les données existantes
            setTodayEntry(entryData)
            setFormData({
              trackingType: entryData.tracking_type || defaultType,
              cigarettesCount: entryData.cigarettes_count || 0,
              vapePuffs: entryData.vape_puffs || 0,
              mood: entryData.mood || 'neutral',
              energyLevel: entryData.energy_level || 3,
              physicalActivityMinutes: entryData.physical_activity_minutes || 0,
              meditationMinutes: entryData.meditation_minutes || 0,
              triggers: entryData.triggers || [],
            })
          } else if (entryError && (
            entryError.message?.includes('schema cache') ||
            entryError.message?.includes('tracking_type') ||
            entryError.code === 'PGRST204'
          )) {
            // Erreur de cache du schéma - utiliser les valeurs par défaut
            setFormData(prev => ({ ...prev, trackingType: defaultType }))
          } else {
            // Pas d'entrée existante, définir le type par défaut
            setFormData(prev => ({ ...prev, trackingType: defaultType }))
          }
        } catch (error) {
          // Erreur inattendue - utiliser les valeurs par défaut
          setFormData(prev => ({ ...prev, trackingType: defaultType }))
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router, today])

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleTrigger = (trigger) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger]
    }))
  }

  const calculateMoneySaved = () => {
    if (!profile) return 0

    const pricePerCig = 0.50 // Prix moyen d'une cigarette
    const pricePerPuff = 0.01 // Prix estimé par bouffée de vape

    let saved = 0

    // Pour les profils "both", calculer les économies des deux
    if (profile.quit_type === 'both') {
      // Économies cigarettes
      const cigBaseline = profile.cigarettes_per_day_baseline || 0
      const cigToday = formData.cigarettesCount
      const cigReduction = Math.max(0, cigBaseline - cigToday)
      const cigSaved = cigReduction * pricePerCig

      // Économies vape
      const baselineMap = { heavy: 300, moderate: 200, light: 100 }
      const vapeBaseline = baselineMap[profile.vape_frequency_baseline] || 200
      const vapeToday = formData.vapePuffs
      const vapeReduction = Math.max(0, vapeBaseline - vapeToday)
      const vapeSaved = vapeReduction * pricePerPuff

      saved = cigSaved + vapeSaved
    } else if (formData.trackingType === 'cigarettes') {
      const baseline = profile.cigarettes_per_day_baseline || 0
      const today = formData.cigarettesCount
      const reduction = Math.max(0, baseline - today)
      saved = reduction * pricePerCig
    } else if (formData.trackingType === 'vape') {
      // Estimation : une baseline "Élevée" = 300 bouffées, "Modérée" = 200, "Légère" = 100
      const baselineMap = { heavy: 300, moderate: 200, light: 100 }
      const baseline = baselineMap[profile.vape_frequency_baseline] || 200
      const today = formData.vapePuffs
      const reduction = Math.max(0, baseline - today)
      saved = reduction * pricePerPuff
    }

    return saved.toFixed(2)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Déterminer le tracking_type et les valeurs à sauvegarder
      let trackingType = formData.trackingType
      let cigarettesCount = 0
      let vapePuffs = 0

      if (profile.quit_type === 'both') {
        // Pour "both", sauvegarder les deux valeurs
        trackingType = 'both'
        cigarettesCount = formData.cigarettesCount
        vapePuffs = formData.vapePuffs
      } else if (formData.trackingType === 'cigarettes') {
        cigarettesCount = formData.cigarettesCount
        vapePuffs = 0
      } else if (formData.trackingType === 'vape') {
        cigarettesCount = 0
        vapePuffs = formData.vapePuffs
      }

      const entryData = {
        user_id: user.id,
        entry_date: today,
        tracking_type: trackingType,
        cigarettes_count: cigarettesCount,
        vape_puffs: vapePuffs,
        mood: formData.mood,
        energy_level: formData.energyLevel,
        physical_activity_minutes: formData.physicalActivityMinutes,
        meditation_minutes: formData.meditationMinutes,
        triggers: formData.triggers,
        money_saved: parseFloat(calculateMoneySaved()),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(entryData, { onConflict: 'user_id,entry_date' })
        .select()

      if (error) {
        // Détecter l'erreur de cache du schéma
        if (error.message?.includes('schema cache') || error.message?.includes('tracking_type') || error.code === 'PGRST204') {
          alert('⚡ Base de données en cours d\'initialisation...\n\nTon tracker se charge pour la première fois. Patiente 1-2 minutes et réessaye.\n\n💡 Astuce: Rafraîchis la page dans quelques instants.')
          return
        }
        throw error
      }

      // Vérifier et débloquer les badges
      const newBadges = await checkAndUnlockBadges(user.id)

      // Vérifier et valider l'objectif du jour
      const goalValidation = await checkAndValidateDailyGoal(user.id, data[0])

      // Préparer le message de succès
      let successMessage = '✅ Ton tracker a été enregistré !'

      // Ajouter les badges débloqués au message
      if (newBadges && newBadges.length > 0) {
        const badgeNames = newBadges.map(b => `${b.emoji} ${b.name}`).join('\n')
        successMessage += `\n\n🏆 Nouveaux badges débloqués:\n${badgeNames}`
      }

      // Ajouter l'objectif complété au message
      if (goalValidation?.completed) {
        successMessage += `\n\n🎯 Objectif du jour accompli!\n"${goalValidation.goalTitle}"\n+${goalValidation.pointsEarned} points 🌟`
      }

      alert(successMessage)

      // Rediriger vers le dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde: ' + error.message)
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

  const moneySaved = calculateMoneySaved()

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
          <h1 className="text-lg font-bold text-white">Tracker du jour</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-xl mx-auto">

          {/* Date du jour */}
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">📊</div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <p className="text-purple-300 text-sm">
              {todayEntry ? 'Modifier ton entrée du jour' : 'Enregistre ta journée'}
            </p>
          </div>

          {/* Section Consommation */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Consommation du jour
            </h3>

            {/* Toggle Cigarettes / Vape - Seulement si profil n'est pas "both" */}
            {profile?.quit_type !== 'both' && (
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => updateFormData('trackingType', 'cigarettes')}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${
                    formData.trackingType === 'cigarettes'
                      ? 'border-cyan-500 bg-cyan-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-purple-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">🚬</div>
                  <div className="text-sm">Cigarettes</div>
                </button>
                <button
                  onClick={() => updateFormData('trackingType', 'vape')}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${
                    formData.trackingType === 'vape'
                      ? 'border-cyan-500 bg-cyan-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-purple-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">💨</div>
                  <div className="text-sm">Vape</div>
                </button>
              </div>
            )}

            {/* Si profil "both", afficher les deux sliders côte à côte */}
            {profile?.quit_type === 'both' ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Slider Cigarettes */}
                <div>
                  <label className="block text-purple-200 text-sm mb-3 flex items-center gap-2">
                    <span>🚬</span>
                    Cigarettes
                  </label>
                  <div className="text-center mb-3">
                    <span className="text-4xl font-bold text-red-400">{formData.cigarettesCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={formData.cigarettesCount}
                    onChange={(e) => updateFormData('cigarettesCount', parseInt(e.target.value))}
                    className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-purple-300 mt-2">
                    <span>0</span>
                    <span>40</span>
                  </div>
                </div>

                {/* Slider Vape */}
                <div>
                  <label className="block text-purple-200 text-sm mb-3 flex items-center gap-2">
                    <span>💨</span>
                    Bouffées vape
                  </label>
                  <div className="text-center mb-3">
                    <span className="text-4xl font-bold text-cyan-400">{formData.vapePuffs}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    value={formData.vapePuffs}
                    onChange={(e) => updateFormData('vapePuffs', parseInt(e.target.value))}
                    className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-purple-300 mt-2">
                    <span>0</span>
                    <span>400</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Slider Cigarettes - Afficher si cigarettes uniquement */}
                {formData.trackingType === 'cigarettes' && (
                  <div>
                    <label className="block text-purple-200 text-sm mb-3 flex items-center gap-2">
                      <span>🚬</span>
                      Combien de cigarettes aujourd'hui ?
                    </label>
                    <div className="text-center mb-3">
                      <span className="text-5xl font-bold text-red-400">{formData.cigarettesCount}</span>
                      <span className="text-purple-300 text-lg ml-2">cigarettes</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={formData.cigarettesCount}
                      onChange={(e) => updateFormData('cigarettesCount', parseInt(e.target.value))}
                      className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-purple-300 mt-2">
                      <span>0</span>
                      <span>40</span>
                    </div>

                    {profile?.cigarettes_per_day_baseline && formData.cigarettesCount < profile.cigarettes_per_day_baseline && (
                      <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                        <p className="text-emerald-300 text-sm text-center">
                          🎉 -{profile.cigarettes_per_day_baseline - formData.cigarettesCount} cigarettes par rapport à ta baseline !
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Slider Vape (bouffées) - Afficher si vape uniquement */}
                {formData.trackingType === 'vape' && (
                  <div>
                    <label className="block text-purple-200 text-sm mb-3 flex items-center gap-2">
                      <span>💨</span>
                      Combien de bouffées de vape aujourd'hui ?
                    </label>
                    <div className="text-center mb-3">
                      <span className="text-5xl font-bold text-cyan-400">{formData.vapePuffs}</span>
                      <span className="text-purple-300 text-lg ml-2">bouffées</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={formData.vapePuffs}
                      onChange={(e) => updateFormData('vapePuffs', parseInt(e.target.value))}
                      className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-purple-300 mt-2">
                      <span>0</span>
                      <span>400</span>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <p className="text-purple-300 text-xs text-center">
                        💡 Une cigarette ≈ 10-15 bouffées de vape
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section Humeur et Énergie */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>😊</span> Comment te sens-tu ?
            </h3>

            {/* Humeur */}
            <div className="mb-6">
              <label className="block text-purple-200 text-sm mb-3">Ton humeur</label>
              <div className="flex gap-2">
                {[
                  { value: 'terrible', emoji: '😫', label: 'Terrible' },
                  { value: 'bad', emoji: '😞', label: 'Pas bien' },
                  { value: 'neutral', emoji: '😐', label: 'Neutre' },
                  { value: 'good', emoji: '🙂', label: 'Bien' },
                  { value: 'great', emoji: '😄', label: 'Super' },
                ].map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => updateFormData('mood', mood.value)}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      formData.mood === mood.value
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-purple-200 text-[10px]">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Niveau d'énergie */}
            <div>
              <label className="block text-purple-200 text-sm mb-3">
                Niveau d'énergie: {formData.energyLevel}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.energyLevel}
                onChange={(e) => updateFormData('energyLevel', parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-purple-300 mt-1">
                <span>Faible</span>
                <span>Élevé</span>
              </div>
            </div>
          </div>

          {/* Section Déclencheurs */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Déclencheurs identifiés
            </h3>
            <p className="text-purple-300 text-xs mb-3">(Sélectionne ceux que tu as remarqués)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'stress', label: 'Stress', emoji: '😰' },
                { value: 'social', label: 'Social', emoji: '👥' },
                { value: 'cafe', label: 'Café', emoji: '☕' },
                { value: 'alcool', label: 'Alcool', emoji: '🍺' },
                { value: 'pause', label: 'Pause', emoji: '⏸️' },
                { value: 'ennui', label: 'Ennui', emoji: '😴' },
                { value: 'habitude', label: 'Habitude', emoji: '🔄' },
                { value: 'emotion', label: 'Émotion', emoji: '💔' },
              ].map((trigger) => (
                <button
                  key={trigger.value}
                  onClick={() => toggleTrigger(trigger.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.triggers.includes(trigger.value)
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{trigger.emoji}</span>
                    <span className="text-white text-sm">{trigger.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section Activités de remplacement */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🏃</span> Activités de remplacement
            </h3>

            <div className="space-y-4">
              {/* Activité physique */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  Activité physique: {formData.physicalActivityMinutes} min
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFormData('physicalActivityMinutes', formData.physicalActivityMinutes + 5)}
                    className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-white py-2 rounded-xl hover:bg-emerald-500/30 transition"
                  >
                    +5 min
                  </button>
                  <button
                    onClick={() => updateFormData('physicalActivityMinutes', formData.physicalActivityMinutes + 15)}
                    className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-white py-2 rounded-xl hover:bg-emerald-500/30 transition"
                  >
                    +15 min
                  </button>
                  <button
                    onClick={() => updateFormData('physicalActivityMinutes', 0)}
                    className="px-4 bg-white/5 border border-white/20 text-purple-300 py-2 rounded-xl hover:bg-white/10 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Méditation */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  Méditation/Respiration: {formData.meditationMinutes} min
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFormData('meditationMinutes', formData.meditationMinutes + 5)}
                    className="flex-1 bg-purple-500/20 border border-purple-500/30 text-white py-2 rounded-xl hover:bg-purple-500/30 transition"
                  >
                    +5 min
                  </button>
                  <button
                    onClick={() => updateFormData('meditationMinutes', formData.meditationMinutes + 15)}
                    className="flex-1 bg-purple-500/20 border border-purple-500/30 text-white py-2 rounded-xl hover:bg-purple-500/30 transition"
                  >
                    +15 min
                  </button>
                  <button
                    onClick={() => updateFormData('meditationMinutes', 0)}
                    className="px-4 bg-white/5 border border-white/20 text-purple-300 py-2 rounded-xl hover:bg-white/10 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé et économies */}
          {moneySaved > 0 && (
            <div className="backdrop-blur-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-white font-semibold mb-2">Économies du jour</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {moneySaved}€
                </div>
                <p className="text-emerald-300 text-sm mt-2">Continue comme ça ! 🎉</p>
              </div>
            </div>
          )}

          {/* Bouton de sauvegarde */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Sauvegarde...' : todayEntry ? 'Mettre à jour mon tracker 📊' : 'Enregistrer mon tracker 📊'}
          </button>

        </div>
      </main>

      <BottomNav />
      <SOSButton />

      <style jsx>{`
        /* Slider styling */
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          cursor: pointer;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
        }

        input[type="range"].slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </div>
  )
}
