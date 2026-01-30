'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})

  // États pour toutes les données collectées
  const [formData, setFormData] = useState({
    // Étape 1 : Prénom, Nom, Pseudo
    firstName: '',
    lastName: '',
    username: '',

    // Étape 2 : Que veux-tu arrêter ?
    quitType: '', // 'cigarettes', 'vape', 'both'

    // Étape 3 : Consommation actuelle
    cigarettesPerDay: 10,
    cigarettesSince: '', // en années
    vapeFrequency: 'moderate', // 'light', 'moderate', 'heavy'
    vapeSince: '', // en années

    // Étape 4 : Motivations (multi-select)
    motivations: [],

    // Étape 5 : Objectif
    currentConsumption: 15,
    targetConsumption: 10,
    targetVapeFrequency: 'light', // Pour la vape : 'light', 'moderate', 'none'
    timeframe: 30, // jours

    // Étape 6 : Niveau d'activité physique
    activityLevel: '', // 'sedentary', 'light', 'moderate', 'active'
    fitnessLevel: '', // 'beginner', 'intermediate', 'advanced'

    // Étape 7 : Notifications
    notificationsEnabled: true,
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Effacer l'erreur quand l'utilisateur modifie le champ
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }))
    }
  }

  const toggleMotivation = (motivation) => {
    setFormData(prev => ({
      ...prev,
      motivations: prev.motivations.includes(motivation)
        ? prev.motivations.filter(m => m !== motivation)
        : [...prev.motivations, motivation]
    }))
  }

  const validateStep = () => {
    const newErrors = {}

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis'
      if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis'
      if (!formData.username.trim()) newErrors.username = 'Le pseudo est requis'
      if (formData.username.length < 3) newErrors.username = 'Le pseudo doit faire au moins 3 caractères'
    }

    if (currentStep === 2) {
      if (!formData.quitType) newErrors.quitType = 'Choisis une option'
    }

    if (currentStep === 3) {
      if (formData.quitType === 'cigarettes' || formData.quitType === 'both') {
        if (!formData.cigarettesSince) newErrors.cigarettesSince = 'Indique depuis combien de temps'
      }
      if (formData.quitType === 'vape' || formData.quitType === 'both') {
        if (!formData.vapeSince) newErrors.vapeSince = 'Indique depuis combien de temps'
      }
    }

    if (currentStep === 4) {
      if (formData.motivations.length === 0) newErrors.motivations = 'Choisis au moins une motivation'
    }

    if (currentStep === 6) {
      if (!formData.activityLevel) newErrors.activityLevel = 'Choisis ton niveau d\'activité'
      if (!formData.fitnessLevel) newErrors.fitnessLevel = 'Choisis ton niveau fitness'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (currentStep === 8) {
      // Dernière étape : sauvegarder tout dans Supabase
      await saveToSupabase()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const saveToSupabase = async () => {
    try {
      setLoading(true)

      const profileData = {
        id: user.id,
        email: user.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        pseudo: formData.username,
        quit_type: formData.quitType,
        cigarettes_per_day_baseline: formData.quitType === 'cigarettes' || formData.quitType === 'both'
          ? formData.cigarettesPerDay
          : null,
        cigarettes_since_years: formData.cigarettesSince || null,
        vape_frequency_baseline: formData.quitType === 'vape' || formData.quitType === 'both'
          ? formData.vapeFrequency
          : null,
        vape_since_years: formData.vapeSince || null,
        motivations: formData.motivations,
        target_cigarettes_per_day: formData.quitType === 'cigarettes' || formData.quitType === 'both'
          ? formData.targetConsumption
          : null,
        target_vape_frequency: formData.quitType === 'vape' || formData.quitType === 'both'
          ? formData.targetVapeFrequency
          : null,
        target_timeframe_days: formData.timeframe,
        activity_level: formData.activityLevel,
        fitness_level: formData.fitnessLevel,
        notifications_enabled: formData.notificationsEnabled,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }

      // Utiliser upsert pour créer ou mettre à jour le profil
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()

      if (error) {
        console.error('Erreur Supabase complète:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error: error
        })
        throw error
      }

      // Redirection vers le dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde complète:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full: error
      })

      let errorMessage = 'Une erreur est survenue.'
      if (error.message) {
        errorMessage = error.message
      }
      if (error.hint) {
        errorMessage += `\n\nIndice: ${error.hint}`
      }
      if (error.details) {
        errorMessage += `\n\nDétails: ${error.details}`
      }

      alert(errorMessage)
    } finally {
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

  const totalSteps = 8
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white">
      {/* Background Elements */}
      <StarField />

      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-[100px] opacity-30" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-300">Étape {currentStep} sur {totalSteps}</span>
            <span className="text-sm text-cyan-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-32 px-4">
        <div className="max-w-xl mx-auto">

          {/* ÉTAPE 1 : Prénom, Nom, Pseudo */}
          {currentStep === 1 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">👋</div>
                <h2 className="text-2xl font-bold text-white mb-2">Bienvenue !</h2>
                <p className="text-purple-300 text-sm">Commençons par faire connaissance</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-purple-200 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Ex: Alex"
                  />
                  {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm text-purple-200 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Ex: Martin"
                  />
                  {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm text-purple-200 mb-2">Pseudo (visible par la communauté)</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateFormData('username', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Ex: Alex92"
                  />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-cyan-300 text-sm">
                  💡 Ton pseudo sera visible sur le forum. Choisis-en un qui te plaît !
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Que veux-tu arrêter ? */}
          {currentStep === 2 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-2">Que veux-tu arrêter ?</h2>
                <p className="text-purple-300 text-sm">Peu importe d'où tu pars, l'important c'est d'être ici maintenant 💜</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updateFormData('quitType', 'cigarettes')}
                  className={`w-full p-5 rounded-xl border-2 transition-all ${
                    formData.quitType === 'cigarettes'
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">🚬</div>
                  <div className="text-white font-semibold">Les cigarettes</div>
                </button>

                <button
                  onClick={() => updateFormData('quitType', 'vape')}
                  className={`w-full p-5 rounded-xl border-2 transition-all ${
                    formData.quitType === 'vape'
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">💨</div>
                  <div className="text-white font-semibold">La vape</div>
                </button>

                <button
                  onClick={() => updateFormData('quitType', 'both')}
                  className={`w-full p-5 rounded-xl border-2 transition-all ${
                    formData.quitType === 'both'
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">🚬💨</div>
                  <div className="text-white font-semibold">Les deux</div>
                </button>
              </div>

              {errors.quitType && <p className="text-red-400 text-sm mt-3 text-center">{errors.quitType}</p>}
            </div>
          )}

          {/* ÉTAPE 3 : Consommation actuelle */}
          {currentStep === 3 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📊</div>
                <h2 className="text-2xl font-bold text-white mb-2">Parlons de ta consommation</h2>
                <p className="text-purple-300 text-sm">Merci pour ton honnêteté. Il n'y a pas de jugement ici, seulement du soutien 🤝</p>
              </div>

              <div className="space-y-6">
                {(formData.quitType === 'cigarettes' || formData.quitType === 'both') && (
                  <div>
                    <label className="block text-sm text-purple-200 mb-3">
                      Combien de cigarettes fumes-tu par jour en moyenne ?
                    </label>
                    <div className="text-center mb-3">
                      <span className="text-4xl font-bold text-cyan-400">{formData.cigarettesPerDay}</span>
                      <span className="text-purple-300 text-lg ml-2">cigarettes/jour</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={formData.cigarettesPerDay}
                      onChange={(e) => updateFormData('cigarettesPerDay', parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />

                    <div className="mt-4">
                      <label className="block text-sm text-purple-200 mb-2">Depuis combien de temps ? (en années)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        step="0.5"
                        value={formData.cigarettesSince}
                        onChange={(e) => updateFormData('cigarettesSince', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                        placeholder="Ex: 5"
                      />
                      {errors.cigarettesSince && <p className="text-red-400 text-xs mt-1">{errors.cigarettesSince}</p>}
                    </div>
                  </div>
                )}

                {(formData.quitType === 'vape' || formData.quitType === 'both') && (
                  <div className={formData.quitType === 'both' ? 'pt-6 border-t border-white/10' : ''}>
                    <label className="block text-sm text-purple-200 mb-3">
                      À quelle fréquence vapes-tu ?
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'light', label: 'Occasionnellement', desc: 'Quelques fois par semaine' },
                        { value: 'moderate', label: 'Régulièrement', desc: 'Tous les jours, plusieurs fois' },
                        { value: 'heavy', label: 'Intensément', desc: 'Très souvent dans la journée' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateFormData('vapeFrequency', option.value)}
                          className={`w-full p-4 rounded-xl border transition-all text-left ${
                            formData.vapeFrequency === option.value
                              ? 'border-cyan-500 bg-cyan-500/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-white font-semibold">{option.label}</div>
                          <div className="text-purple-300 text-xs">{option.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm text-purple-200 mb-2">Depuis combien de temps ? (en années)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        step="0.5"
                        value={formData.vapeSince}
                        onChange={(e) => updateFormData('vapeSince', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                        placeholder="Ex: 2"
                      />
                      {errors.vapeSince && <p className="text-red-400 text-xs mt-1">{errors.vapeSince}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <p className="text-purple-300 text-sm">
                  💜 Ces informations nous permettent de personnaliser ton parcours
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Motivations */}
          {currentStep === 4 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">💪</div>
                <h2 className="text-2xl font-bold text-white mb-2">Qu'est-ce qui te motive ?</h2>
                <p className="text-purple-300 text-sm">Tes raisons sont légitimes. On va y arriver ensemble, étape par étape ✨</p>
              </div>

              <p className="text-purple-200 text-sm mb-4 text-center">(Tu peux en choisir plusieurs)</p>

              <div className="space-y-3">
                {[
                  { value: 'health', icon: '❤️', label: 'Ma santé', desc: 'Respirer mieux, vivre plus longtemps' },
                  { value: 'money', icon: '💰', label: 'Économiser', desc: 'Arrêter de dépenser inutilement' },
                  { value: 'family', icon: '👨‍👩‍👧‍👦', label: 'Ma famille', desc: 'Être un bon exemple pour mes proches' },
                  { value: 'performance', icon: '🏃', label: 'Performance', desc: 'Améliorer mes capacités physiques' },
                  { value: 'control', icon: '🎯', label: 'Reprendre le contrôle', desc: 'Ne plus être dépendant(e)' },
                  { value: 'other', icon: '✨', label: 'Autre raison', desc: 'Une motivation personnelle' },
                ].map((motivation) => (
                  <button
                    key={motivation.value}
                    onClick={() => toggleMotivation(motivation.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      formData.motivations.includes(motivation.value)
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{motivation.icon}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">{motivation.label}</div>
                        <div className="text-purple-300 text-xs">{motivation.desc}</div>
                      </div>
                      {formData.motivations.includes(motivation.value) && (
                        <div className="text-cyan-400 text-xl">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {errors.motivations && <p className="text-red-400 text-sm mt-3 text-center">{errors.motivations}</p>}
            </div>
          )}

          {/* ÉTAPE 5 : Objectif */}
          {currentStep === 5 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-2">Ton premier objectif</h2>
                <p className="text-purple-300 text-sm">L'objectif final ? Zéro. Mais on y va progressivement ! 💪</p>
              </div>

              <div className="space-y-6">
                {/* Pour les cigarettes */}
                {(formData.quitType === 'cigarettes' || formData.quitType === 'both') && (
                  <div>
                    <label className="block text-sm text-purple-200 mb-3">
                      {formData.quitType === 'both' ? '📊 Cigarettes : réduire à combien par jour ?' : 'Réduire à combien par jour ?'}
                    </label>
                    <div className="text-center mb-3">
                      <span className="text-4xl font-bold text-emerald-400">{formData.targetConsumption}</span>
                      <span className="text-purple-300 text-lg ml-2">
                        {formData.targetConsumption === 0 ? 'Arrêt total !' : 'cigarettes/jour'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={formData.cigarettesPerDay}
                      value={formData.targetConsumption}
                      onChange={(e) => updateFormData('targetConsumption', parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-purple-300 mt-1">
                      <span>0 (arrêt total)</span>
                      <span>{formData.cigarettesPerDay} (actuel)</span>
                    </div>

                    {formData.targetConsumption < formData.cigarettesPerDay && (
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-white/20">
                        <div className="text-center">
                          <div className="text-purple-200 text-sm mb-1">Première étape</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            -{formData.cigarettesPerDay - formData.targetConsumption} cigarettes/jour
                          </div>
                          <div className="text-purple-300 text-xs mt-1">
                            soit -{Math.round(((formData.cigarettesPerDay - formData.targetConsumption) / formData.cigarettesPerDay) * 100)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pour la vape */}
                {formData.quitType === 'vape' && (
                  <div>
                    <label className="block text-sm text-purple-200 mb-3 text-center">
                      Vers quel niveau veux-tu réduire en premier ?
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'light', label: 'Occasionnel', desc: 'Quelques fois par semaine seulement', emoji: '🌱' },
                        { value: 'moderate', label: 'Modéré', desc: 'Une fois par jour maximum', emoji: '🌿' },
                        { value: 'none', label: 'Arrêt total', desc: 'Je vise zéro directement', emoji: '🏆' },
                      ].map((option) => {
                        const isCurrent = option.value === formData.vapeFrequency
                        const isTarget = option.value === (formData.targetVapeFrequency || 'light')

                        return (
                          <button
                            key={option.value}
                            onClick={() => updateFormData('targetVapeFrequency', option.value)}
                            disabled={isCurrent}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              isTarget
                                ? 'border-cyan-500 bg-cyan-500/20'
                                : isCurrent
                                ? 'border-purple-500/30 bg-purple-500/10 opacity-50 cursor-not-allowed'
                                : 'border-white/20 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{option.emoji}</div>
                              <div className="flex-1">
                                <div className="text-white font-semibold">
                                  {option.label}
                                  {isCurrent && <span className="text-purple-400 text-xs ml-2">(actuel)</span>}
                                </div>
                                <div className="text-purple-300 text-xs">{option.desc}</div>
                              </div>
                              {isTarget && <div className="text-cyan-400 text-xl">✓</div>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Si les deux */}
                {formData.quitType === 'both' && (
                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-sm text-purple-200 mb-3">
                      💨 Vape : réduire à quelle fréquence ?
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'light', label: 'Occasionnel', desc: 'Quelques fois par semaine', emoji: '🌱' },
                        { value: 'moderate', label: 'Modéré', desc: 'Une fois par jour max', emoji: '🌿' },
                        { value: 'none', label: 'Arrêt total', desc: 'Je vise zéro', emoji: '🏆' },
                      ].map((option) => {
                        const isCurrent = option.value === formData.vapeFrequency
                        const isTarget = option.value === (formData.targetVapeFrequency || 'light')

                        return (
                          <button
                            key={option.value}
                            onClick={() => updateFormData('targetVapeFrequency', option.value)}
                            disabled={isCurrent}
                            className={`w-full p-3 rounded-xl border transition-all text-left text-sm ${
                              isTarget
                                ? 'border-cyan-500 bg-cyan-500/20'
                                : isCurrent
                                ? 'border-purple-500/30 bg-purple-500/10 opacity-50 cursor-not-allowed'
                                : 'border-white/20 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-lg">{option.emoji}</div>
                              <div className="flex-1">
                                <div className="text-white font-medium">
                                  {option.label}
                                  {isCurrent && <span className="text-purple-400 text-xs ml-1">(actuel)</span>}
                                </div>
                                <div className="text-purple-300 text-xs">{option.desc}</div>
                              </div>
                              {isTarget && <div className="text-cyan-400">✓</div>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-purple-200 mb-3 text-center">
                    En combien de temps veux-tu atteindre cet objectif ?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => updateFormData('timeframe', days)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.timeframe === days
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-white font-semibold text-sm">{days}j</div>
                        <div className="text-purple-300 text-[10px]">
                          {days === 15 ? 'Express' : days === 30 ? 'Idéal' : days === 60 ? 'Doux' : 'Zen'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-emerald-300 text-sm">
                  💚 On commence par une réduction progressive. L'arrêt total viendra ensuite, étape par étape !
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 6 : Niveau d'activité physique */}
          {currentStep === 6 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🏃</div>
                <h2 className="text-2xl font-bold text-white mb-2">Parlons activité physique</h2>
                <p className="text-purple-300 text-sm">L'exercice va devenir ton meilleur allié ! 💪</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-purple-200 mb-3">
                    Quel est ton niveau d'activité actuel ?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'sedentary', label: 'Sédentaire', desc: 'Peu ou pas d\'activité' },
                      { value: 'light', label: 'Léger', desc: 'Quelques activités par semaine' },
                      { value: 'moderate', label: 'Modéré', desc: 'Actif(ve) régulièrement' },
                      { value: 'active', label: 'Actif', desc: 'Sport intensif plusieurs fois/semaine' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateFormData('activityLevel', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          formData.activityLevel === option.value
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-white font-semibold">{option.label}</div>
                        <div className="text-purple-300 text-xs">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                  {errors.activityLevel && <p className="text-red-400 text-xs mt-1">{errors.activityLevel}</p>}
                </div>

                <div>
                  <label className="block text-sm text-purple-200 mb-3">
                    Quel niveau te correspond le mieux ?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'beginner', label: 'Débutant', desc: 'Je commence tout juste' },
                      { value: 'intermediate', label: 'Intermédiaire', desc: 'J\'ai des bases solides' },
                      { value: 'advanced', label: 'Avancé', desc: 'Je suis expérimenté(e)' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateFormData('fitnessLevel', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          formData.fitnessLevel === option.value
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-white font-semibold">{option.label}</div>
                        <div className="text-purple-300 text-xs">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                  {errors.fitnessLevel && <p className="text-red-400 text-xs mt-1">{errors.fitnessLevel}</p>}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-cyan-300 text-sm">
                  💡 On va te proposer des exercices adaptés à ton niveau
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 7 : Notifications */}
          {currentStep === 7 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔔</div>
                <h2 className="text-2xl font-bold text-white mb-2">Reste motivé(e)</h2>
                <p className="text-purple-300 text-sm">Les notifications t'aideront à rester sur la bonne voie</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => updateFormData('notificationsEnabled', !formData.notificationsEnabled)}
                  className={`w-full p-6 rounded-xl border-2 transition-all ${
                    formData.notificationsEnabled
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-white font-semibold mb-1">Activer les notifications</div>
                      <div className="text-purple-300 text-sm">Rappels quotidiens et encouragements</div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-all ${
                      formData.notificationsEnabled ? 'bg-cyan-500' : 'bg-white/20'
                    }`}>
                      <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                        formData.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      } mt-0.5`} />
                    </div>
                  </div>
                </button>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">✅</div>
                    <div>
                      <div className="text-white text-sm font-medium">Rappel tracker</div>
                      <div className="text-purple-300 text-xs">Chaque soir à 21h</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📓</div>
                    <div>
                      <div className="text-white text-sm font-medium">Écrire ton journal</div>
                      <div className="text-purple-300 text-xs">Chaque soir à 20h</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">🎉</div>
                    <div>
                      <div className="text-white text-sm font-medium">Célébrations</div>
                      <div className="text-purple-300 text-xs">Badges, niveaux, objectifs</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">💬</div>
                    <div>
                      <div className="text-white text-sm font-medium">Interactions sociales</div>
                      <div className="text-purple-300 text-xs">Commentaires, likes, messages</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <p className="text-purple-300 text-sm">
                  🔕 Tu pourras personnaliser tes préférences dans les paramètres
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 8 : Prêt à commencer */}
          {currentStep === 8 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-white mb-3">Tu es prêt(e) !</h2>
                <p className="text-purple-300 text-sm mb-4">
                  Félicitations ! Tu viens de faire le premier pas vers une vie sans dépendance
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">👤</div>
                    <div>
                      <div className="text-white font-semibold">{formData.firstName} "{formData.username}"</div>
                      <div className="text-purple-300 text-sm">Ton profil est configuré</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">🎯</div>
                    <div className="flex-1">
                      {formData.quitType === 'cigarettes' && (
                        <div className="text-white font-semibold">
                          {formData.cigarettesPerDay} → {formData.targetConsumption} {formData.targetConsumption === 0 ? '(arrêt total)' : 'cigarettes/jour'}
                        </div>
                      )}
                      {formData.quitType === 'vape' && (
                        <div className="text-white font-semibold">
                          Vape : {formData.vapeFrequency === 'light' ? 'Occasionnel' : formData.vapeFrequency === 'moderate' ? 'Modéré' : 'Intensif'} → {
                            formData.targetVapeFrequency === 'none' ? 'Arrêt total' :
                            formData.targetVapeFrequency === 'light' ? 'Occasionnel' :
                            'Modéré'
                          }
                        </div>
                      )}
                      {formData.quitType === 'both' && (
                        <div>
                          <div className="text-white font-semibold text-sm">
                            Cigarettes : {formData.cigarettesPerDay} → {formData.targetConsumption} {formData.targetConsumption === 0 ? '(zéro)' : '/jour'}
                          </div>
                          <div className="text-white font-semibold text-sm">
                            Vape : {formData.vapeFrequency === 'light' ? 'Occasionnel' : formData.vapeFrequency === 'moderate' ? 'Modéré' : 'Intensif'} → {
                              formData.targetVapeFrequency === 'none' ? 'Zéro' :
                              formData.targetVapeFrequency === 'light' ? 'Occasionnel' :
                              'Modéré'
                            }
                          </div>
                        </div>
                      )}
                      <div className="text-purple-300 text-sm mt-1">Objectif sur {formData.timeframe} jours</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">💪</div>
                    <div>
                      <div className="text-white font-semibold">
                        {formData.motivations.length} motivation{formData.motivations.length > 1 ? 's' : ''} identifiée{formData.motivations.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-purple-300 text-sm">Tu as toutes les cartes en main</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40">
                <div className="text-center">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="text-amber-200 font-medium mb-2">
                    Souviens-toi : chaque pas vers l'arrêt est une victoire
                  </p>
                  <p className="text-amber-300/80 text-sm">
                    Tu n'es pas seul(e). La communauté est là pour toi. 💜
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10 transition"
              >
                ← Retour
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sauvegarde...' : currentStep === 8 ? 'Commencer l\'aventure 🚀' : 'Continuer →'}
            </button>
          </div>

        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        /* Slider styling */
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }

        input[type="range"].slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  )
}
