'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ManageExercisesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    category: 'fitness',
    body_parts: [],
    color_code: 'from-red-500 to-orange-500',
    description: '',
    recto_description: '',
    verso_instructions: '',
    easy_variant: '',
    normal_variant: '',
    hard_variant: '',
    duration_minutes: 10,
    calories_burn_estimate: 0,
    benefits: [],
    equipment_needed: [],
    unlock_order: 0
  })

  const categories = [
    { value: 'fitness', label: '💪 Fitness (Force & Cardio)' },
    { value: 'yoga', label: '🧘 Yoga (Postures & Étirements)' },
    { value: 'meditation', label: '🧠 Méditation (Mental & Respiration)' },
    { value: 'mixed', label: '🔥 Mixte (Programmes combinés)' },
  ]

  const bodyParts = [
    'upper_body', 'lower_body', 'core', 'full_body', 'mind'
  ]

  const colorOptions = [
    { value: 'from-red-500 to-orange-500', label: '🔴 Rouge-Orange (Haut du corps)' },
    { value: 'from-blue-500 to-cyan-500', label: '🔵 Bleu-Cyan (Bas du corps)' },
    { value: 'from-purple-500 to-pink-500', label: '🟣 Violet-Rose (Core)' },
    { value: 'from-green-500 to-emerald-500', label: '🟢 Vert (Respiration/Esprit)' },
    { value: 'from-yellow-500 to-orange-500', label: '🟡 Jaune-Orange (Cardio)' },
    { value: 'from-indigo-500 to-purple-500', label: '🟣 Indigo-Violet (Yoga/Flex)' },
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

      // Charger les cartes existantes
      const { data: cardsData, error: cardsError } = await supabase
        .from('exercise_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (!cardsError && cardsData) {
        setCards(cardsData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('exercise_cards')
        .insert({
          ...formData,
          order_index: cards.length
        })

      if (error) throw error

      alert('✅ Carte ajoutée avec succès !')
      setShowForm(false)
      setFormData({
        title: '',
        category: 'fitness',
        body_parts: [],
        color_code: 'from-red-500 to-orange-500',
        description: '',
        recto_description: '',
        verso_instructions: '',
        easy_variant: '',
        normal_variant: '',
        hard_variant: '',
        duration_minutes: 10,
        calories_burn_estimate: 0,
        benefits: [],
        equipment_needed: [],
        unlock_order: 0
      })
      await loadData()
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de l\'ajout: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette carte ?')) return

    try {
      const { error } = await supabase
        .from('exercise_cards')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ Carte supprimée')
      await loadData()
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const toggleBodyPart = (part) => {
    setFormData(prev => ({
      ...prev,
      body_parts: prev.body_parts.includes(part)
        ? prev.body_parts.filter(p => p !== part)
        : [...prev.body_parts, part]
    }))
  }

  const addToArray = (field, value) => {
    if (!value.trim()) return
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }))
  }

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/activities" className="text-purple-300 hover:text-white transition">
            ← Retour
          </Link>
          <h1 className="text-lg font-bold text-white">Gérer les cartes</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Stats */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">📚 Bibliothèque de cartes</h2>
                <p className="text-purple-300">{cards.length} cartes créées sur 56</p>
                <p className="text-purple-400 text-sm mt-1">
                  (10 méditation, 27 yoga, 19 fitness)
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition"
              >
                {showForm ? '❌ Annuler' : '➕ Ajouter une carte'}
              </button>
            </div>
          </div>

          {/* Formulaire */}
          {showForm && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-6">✍️ Nouvelle carte d'exercice</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Pompes classiques"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-cyan-500 transition"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Couleur */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Couleur de la carte *
                  </label>
                  <select
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-cyan-500 transition"
                    required
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>

                {/* Parties du corps */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Parties du corps travaillées
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {bodyParts.map(part => (
                      <button
                        key={part}
                        type="button"
                        onClick={() => toggleBodyPart(part)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          formData.body_parts.includes(part)
                            ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        }`}
                      >
                        {part.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ordre de déverrouillage (seulement pour méditation) */}
                {formData.category === 'meditation' && (
                  <div className="backdrop-blur-xl bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      🔓 Ordre de déverrouillage progressif (1-10)
                    </label>
                    <input
                      type="number"
                      value={formData.unlock_order}
                      onChange={(e) => setFormData({ ...formData, unlock_order: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="10"
                      placeholder="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-green-500 transition"
                    />
                    <p className="text-xs text-green-300/80 mt-2">
                      💡 La carte 1 sera accessible directement, les autres se déverrouilleront progressivement
                    </p>
                  </div>
                )}

                {/* Recto */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Recto (description visuelle)
                  </label>
                  <textarea
                    value={formData.recto_description}
                    onChange={(e) => setFormData({ ...formData, recto_description: e.target.value })}
                    placeholder="Ex: Position de planche, mains au sol"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>

                {/* Verso - Instructions */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Verso - Instructions détaillées *
                  </label>
                  <textarea
                    value={formData.verso_instructions}
                    onChange={(e) => setFormData({ ...formData, verso_instructions: e.target.value })}
                    placeholder="Instructions complètes de l'exercice..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none"
                    required
                  />
                </div>

                {/* Variantes */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      😌 Variante facile
                    </label>
                    <textarea
                      value={formData.easy_variant}
                      onChange={(e) => setFormData({ ...formData, easy_variant: e.target.value })}
                      placeholder="Version simplifiée..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">
                      💪 Variante normale
                    </label>
                    <textarea
                      value={formData.normal_variant}
                      onChange={(e) => setFormData({ ...formData, normal_variant: e.target.value })}
                      placeholder="Version standard..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      🔥 Variante difficile
                    </label>
                    <textarea
                      value={formData.hard_variant}
                      onChange={(e) => setFormData({ ...formData, hard_variant: e.target.value })}
                      placeholder="Version avancée..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition resize-none text-sm"
                    />
                  </div>
                </div>

                {/* Durée et calories */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-cyan-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Calories (estimation)
                    </label>
                    <input
                      type="number"
                      value={formData.calories_burn_estimate}
                      onChange={(e) => setFormData({ ...formData, calories_burn_estimate: parseInt(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                {/* Bénéfices */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Bénéfices
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      id="benefit-input"
                      placeholder="Ex: Force du haut du corps"
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addToArray('benefits', e.target.value)
                          e.target.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('benefit-input')
                        addToArray('benefits', input.value)
                        input.value = ''
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm flex items-center gap-2"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeFromArray('benefits', idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Ajouter la carte'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des cartes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cartes existantes</h3>

            {cards.map((card) => (
              <div
                key={card.id}
                className={`backdrop-blur-xl bg-gradient-to-br ${card.color_code} border border-white/20 rounded-2xl p-5`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg mb-2">{card.title}</h4>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-1 rounded-lg bg-white/20 text-white text-xs">
                        {categories.find(c => c.value === card.category)?.label}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white/20 text-white text-xs">
                        {card.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">{card.recto_description}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="ml-4 w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 transition flex items-center justify-center text-red-300 border border-red-500/30"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {cards.length === 0 && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">Aucune carte pour le moment</h3>
                <p className="text-purple-300">Commence à ajouter tes 77 cartes d'exercices !</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
