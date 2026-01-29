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

// Graphique de consommation (cigarettes ou vape)
function ConsumptionChart({ data, trackingType }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-purple-300 text-sm">
        Aucune donnée pour cette période
      </div>
    )
  }

  // Calculer la valeur max pour l'échelle
  const values = trackingType === 'cigarettes'
    ? data.map(d => d.cigarettes_count || 0)
    : data.map(d => d.vape_puffs || 0)

  const maxData = Math.max(...values)
  let maxValue
  if (trackingType === 'cigarettes') {
    maxValue = maxData === 0 ? 20 : Math.max(maxData * 1.2, 10)
  } else {
    maxValue = maxData === 0 ? 100 : Math.max(maxData * 1.2, 50)
  }

  // Dimensions du graphique
  const width = 100
  const height = 100
  const padding = 10

  // Calculer les points pour la courbe
  const points = data.map((item, index) => {
    const value = trackingType === 'cigarettes'
      ? (item.cigarettes_count || 0)
      : (item.vape_puffs || 0)
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value / maxValue) * (height - 2 * padding))
    return { x, y, value, date: item.entry_date }
  })

  // Créer le path de la courbe
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2
    pathD += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`
    if (i === points.length - 2) {
      pathD += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`
    }
  }

  const fillPath = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div className="relative h-48">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="statsConsumptionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.05 }} />
          </linearGradient>
          <linearGradient id="statsConsumptionLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        <path d={fillPath} fill="url(#statsConsumptionGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="url(#statsConsumptionLineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Points interactifs - afficher moins de points si beaucoup de données */}
      <div className="absolute inset-0 flex items-end justify-between">
        {data.map((item, index) => {
          // Afficher seulement certains points si > 30 jours
          if (data.length > 30 && index % Math.ceil(data.length / 30) !== 0) return null

          const value = trackingType === 'cigarettes'
            ? (item.cigarettes_count || 0)
            : (item.vape_puffs || 0)
          const point = points[index]
          const yPercent = ((height - point.y) / height) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center relative" style={{ height: '100%' }}>
              <div
                className="absolute cursor-pointer z-10"
                style={{ bottom: `${yPercent}%`, left: '50%', transform: 'translate(-50%, 50%)' }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 transition-all duration-300 ${hoveredPoint === index ? 'scale-150 ring-4 ring-purple-500/50' : 'scale-100'}`} />

                {hoveredPoint === index && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {value} {trackingType === 'cigarettes' ? 'cig' : 'bouff.'}
                    <br />
                    {new Date(item.entry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7') // 7, 30, 90, 365
  const [data, setData] = useState([])
  const [stats, setStats] = useState({
    average: 0,
    best: null,
    worst: null,
    trend: 0,
    totalMoneySaved: 0,
    totalDays: 0,
  })

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Charger le profil
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

      // Calculer la date de début selon la période
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(period) + 1)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Charger les données de la période
      const { data: entriesData, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDateStr)
        .order('entry_date', { ascending: true })

      if (entriesError) {
        console.error('Erreur entrées:', entriesError)
        setLoading(false)
        return
      }

      // Créer un tableau complet avec toutes les dates
      const fullData = []
      for (let i = 0; i < parseInt(period); i++) {
        const date = new Date()
        date.setDate(date.getDate() - (parseInt(period) - 1 - i))
        const dateStr = date.toISOString().split('T')[0]

        const entry = entriesData?.find(e => e.entry_date === dateStr)
        fullData.push(entry || {
          entry_date: dateStr,
          cigarettes_count: 0,
          vape_puffs: 0,
          money_saved: 0,
          tracking_type: profileData.quit_type === 'vape' ? 'vape' : 'cigarettes'
        })
      }

      setData(fullData)

      // Calculer les statistiques
      const trackingType = profileData.quit_type === 'vape' ? 'vape' : 'cigarettes'
      const values = fullData.map(d =>
        trackingType === 'cigarettes' ? (d.cigarettes_count || 0) : (d.vape_puffs || 0)
      )

      const nonZeroValues = values.filter(v => v > 0)
      const average = nonZeroValues.length > 0
        ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length
        : 0

      // Trouver meilleur et pire jour
      const entriesWithValues = fullData.filter(d => {
        const val = trackingType === 'cigarettes' ? d.cigarettes_count : d.vape_puffs
        return val > 0
      })

      let best = null
      let worst = null
      if (entriesWithValues.length > 0) {
        best = entriesWithValues.reduce((min, entry) => {
          const val = trackingType === 'cigarettes' ? entry.cigarettes_count : entry.vape_puffs
          const minVal = trackingType === 'cigarettes' ? min.cigarettes_count : min.vape_puffs
          return val < minVal ? entry : min
        })

        worst = entriesWithValues.reduce((max, entry) => {
          const val = trackingType === 'cigarettes' ? entry.cigarettes_count : entry.vape_puffs
          const maxVal = trackingType === 'cigarettes' ? max.cigarettes_count : max.vape_puffs
          return val > maxVal ? entry : max
        })
      }

      // Calculer la tendance (pente sur les 7 derniers jours)
      const lastWeek = values.slice(-7)
      let trend = 0
      if (lastWeek.length >= 2) {
        const firstHalf = lastWeek.slice(0, Math.floor(lastWeek.length / 2))
        const secondHalf = lastWeek.slice(Math.floor(lastWeek.length / 2))
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        trend = avgSecond - avgFirst
      }

      // Total économisé
      const totalSaved = fullData.reduce((sum, entry) => sum + (parseFloat(entry.money_saved) || 0), 0)

      setStats({
        average: Math.round(average * 10) / 10,
        best,
        worst,
        trend: Math.round(trend * 10) / 10,
        totalMoneySaved: totalSaved,
        totalDays: entriesWithValues.length,
      })

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

  const trackingType = profile?.quit_type === 'vape' ? 'vape' : 'cigarettes'
  const unit = trackingType === 'cigarettes' ? 'cigarettes' : 'bouffées'

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
          <h1 className="text-lg font-semibold text-white">📈 Statistiques</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Sélecteur de période */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '7 jours', value: '7' },
                { label: '30 jours', value: '30' },
                { label: '3 mois', value: '90' },
                { label: '1 an', value: '365' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    period === p.value
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Graphique principal */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {trackingType === 'cigarettes' ? '🚬' : '💨'}
              Évolution sur {period} jours
            </h2>
            <ConsumptionChart data={data} trackingType={trackingType} />
          </div>

          {/* Stats en grille */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Moyenne */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-purple-300 text-sm mb-1">Moyenne / jour</div>
              <div className="text-3xl font-bold text-white">{stats.average}</div>
              <div className="text-purple-300 text-xs">{unit}</div>
            </div>

            {/* Tendance */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-purple-300 text-sm mb-1">Tendance 7j</div>
              <div className={`text-3xl font-bold ${stats.trend < 0 ? 'text-emerald-400' : stats.trend > 0 ? 'text-red-400' : 'text-white'}`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}
              </div>
              <div className="text-purple-300 text-xs">
                {stats.trend < 0 ? '✓ En baisse' : stats.trend > 0 ? '⚠ En hausse' : 'Stable'}
              </div>
            </div>

            {/* Meilleur jour */}
            {stats.best && (
              <div className="backdrop-blur-xl bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-5">
                <div className="text-emerald-300 text-sm mb-1">🎉 Meilleur jour</div>
                <div className="text-2xl font-bold text-white">
                  {trackingType === 'cigarettes' ? stats.best.cigarettes_count : stats.best.vape_puffs} {unit}
                </div>
                <div className="text-emerald-300 text-xs">
                  {new Date(stats.best.entry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            )}

            {/* Pire jour */}
            {stats.worst && (
              <div className="backdrop-blur-xl bg-orange-500/20 border border-orange-500/30 rounded-2xl p-5">
                <div className="text-orange-300 text-sm mb-1">⚠️ Jour difficile</div>
                <div className="text-2xl font-bold text-white">
                  {trackingType === 'cigarettes' ? stats.worst.cigarettes_count : stats.worst.vape_puffs} {unit}
                </div>
                <div className="text-orange-300 text-xs">
                  {new Date(stats.worst.entry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            )}
          </div>

          {/* Économies et santé */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">💰 Économies</h2>
            <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-5">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {stats.totalMoneySaved.toFixed(2)}€
              </div>
              <div className="text-emerald-300 text-sm">
                économisés sur {period} jours
              </div>
            </div>
          </div>

          {/* Objectifs */}
          {profile && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎯 Objectifs</h2>
              <div className="space-y-4">
                {/* Objectif de réduction */}
                {trackingType === 'cigarettes' && profile.target_cigarettes_per_day && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">Objectif cigarettes/jour</span>
                      <span className="text-white font-semibold">
                        {stats.average} / {profile.target_cigarettes_per_day}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((stats.average / profile.target_cigarettes_per_day) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Baseline */}
                {trackingType === 'cigarettes' && profile.cigarettes_per_day_baseline && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-purple-300 text-sm mb-2">Comparaison avec ton départ</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-white">{profile.cigarettes_per_day_baseline}</div>
                        <div className="text-xs text-purple-300">Baseline</div>
                      </div>
                      <div className="text-3xl">→</div>
                      <div>
                        <div className="text-2xl font-bold text-cyan-400">{stats.average}</div>
                        <div className="text-xs text-cyan-300">Maintenant</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${profile.cigarettes_per_day_baseline - stats.average > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profile.cigarettes_per_day_baseline - stats.average > 0 ? '-' : '+'}
                          {Math.abs(profile.cigarettes_per_day_baseline - stats.average).toFixed(1)}
                        </div>
                        <div className="text-xs text-purple-300">Différence</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Jours trackés */}
                <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4">
                  <div className="text-cyan-300 text-sm mb-2">📅 Suivi régulier</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalDays} / {period} jours
                  </div>
                  <div className="text-xs text-cyan-300 mt-1">
                    {Math.round((stats.totalDays / parseInt(period)) * 100)}% de la période trackée
                  </div>
                </div>
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
