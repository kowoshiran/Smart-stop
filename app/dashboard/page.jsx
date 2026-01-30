'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import SOSButton from '@/components/SOSButton'
import ProfileMenu from '@/components/ProfileMenu'

// Fonction pour calculer le message de progression
function getProgressMessage(data, type = 'consumption') {
  if (!data || data.length < 2) return null

  if (type === 'consumption') {
    // Comparer les 3 derniers jours aux 3 premiers
    const halfPoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, halfPoint)
    const secondHalf = data.slice(halfPoint)

    const firstAvg = firstHalf.reduce((sum, d) => {
      const val = (d.cigarettes_count || 0) + (d.vape_puffs || 0) / 20 // Normaliser vape
      return sum + val
    }, 0) / firstHalf.length

    const secondAvg = secondHalf.reduce((sum, d) => {
      const val = (d.cigarettes_count || 0) + (d.vape_puffs || 0) / 20
      return sum + val
    }, 0) / secondHalf.length

    const diff = ((firstAvg - secondAvg) / firstAvg) * 100

    if (diff > 20) return { text: '🎉 Excellent progrès !', color: 'text-emerald-400' }
    if (diff > 10) return { text: '✨ Ça progresse !', color: 'text-cyan-400' }
    if (diff > 0) return { text: '👍 Continue comme ça', color: 'text-purple-400' }
    if (diff > -10) return { text: '💪 Reste fort', color: 'text-amber-400' }
    return { text: '⚠️ En hausse', color: 'text-red-400' }
  }

  if (type === 'activity') {
    const halfPoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, halfPoint)
    const secondHalf = data.slice(halfPoint)

    const firstAvg = firstHalf.reduce((sum, d) => sum + (d.physical_activity || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d.physical_activity || 0), 0) / secondHalf.length

    const diff = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100

    if (diff > 20) return { text: '🔥 En forte hausse !', color: 'text-emerald-400' }
    if (diff > 10) return { text: '📈 Bien joué !', color: 'text-cyan-400' }
    if (diff > 0) return { text: '✅ Ça progresse', color: 'text-purple-400' }
    return { text: '💪 Continue', color: 'text-amber-400' }
  }

  return null
}

// Composant pour les étoiles animées
function StarField() {
  const [stars, setStars] = useState([])

  useEffect(() => {
    const newStars = []
    for (let i = 0; i < 80; i++) {
      newStars.push({
        id: i,
        width: Math.random() * 2.5 + 0.5,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: Math.random() * 3 + 3,
      })
    }
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-70">
      <style jsx>{`
        @keyframes starDrift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(2px, -2px); }
          50% { transform: translate(-1px, 2px); }
          75% { transform: translate(1px, 1px); }
        }
      `}</style>
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
            animation: `pulse ${star.duration}s ease-in-out ${star.delay}s infinite, starDrift ${star.duration * 3}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// Graphique de consommation (cigarettes ou vape ou les deux)
function ConsumptionChart({ data, userProfile }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-purple-300 text-sm">
        Aucune donnée pour le moment.<br/>Remplis ton tracker pour voir ton évolution !
      </div>
    )
  }

  // Déterminer le type de tracking : on utilise le profil en priorité
  const trackingTypes = data.map(d => d.tracking_type).filter(Boolean)
  const dataTrackingType = trackingTypes[trackingTypes.length - 1] || 'cigarettes'

  // Si le profil est "both", forcer le mode dual-axis
  const trackingType = userProfile?.quit_type === 'both' ? 'both' : dataTrackingType
  const isBothTracking = trackingType === 'both'

  // Dimensions du graphique
  const width = 100
  const height = 100
  const padding = 10

  // Si tracking "both", créer deux courbes avec deux échelles
  if (isBothTracking) {
    // Calculer les max pour chaque métrique
    const cigValues = data.map(d => d.cigarettes_count || 0)
    const vapeValues = data.map(d => d.vape_puffs || 0)
    const maxCig = Math.max(...cigValues)
    const maxVape = Math.max(...vapeValues)
    const maxCigValue = maxCig === 0 ? 20 : Math.max(maxCig * 1.2, 10)
    const maxVapeValue = maxVape === 0 ? 100 : Math.max(maxVape * 1.2, 50)

    // Calculer les points pour les cigarettes (courbe rouge)
    const cigPoints = data.map((item, index) => {
      const value = item.cigarettes_count || 0
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value / maxCigValue) * (height - 2 * padding))
      return { x, y, value, date: item.entry_date }
    })

    // Calculer les points pour la vape (courbe cyan)
    const vapePoints = data.map((item, index) => {
      const value = item.vape_puffs || 0
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value / maxVapeValue) * (height - 2 * padding))
      return { x, y, value, date: item.entry_date }
    })

    // Créer les paths pour cigarettes (rouge)
    let cigPathD = `M ${cigPoints[0].x} ${cigPoints[0].y}`
    for (let i = 0; i < cigPoints.length - 1; i++) {
      const current = cigPoints[i]
      const next = cigPoints[i + 1]
      const midX = (current.x + next.x) / 2
      cigPathD += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`
      if (i === cigPoints.length - 2) {
        cigPathD += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`
      }
    }
    const cigFillPath = `${cigPathD} L ${cigPoints[cigPoints.length - 1].x} ${height} L ${cigPoints[0].x} ${height} Z`

    // Créer les paths pour vape (cyan)
    let vapePathD = `M ${vapePoints[0].x} ${vapePoints[0].y}`
    for (let i = 0; i < vapePoints.length - 1; i++) {
      const current = vapePoints[i]
      const next = vapePoints[i + 1]
      const midX = (current.x + next.x) / 2
      vapePathD += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`
      if (i === vapePoints.length - 2) {
        vapePathD += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`
      }
    }
    const vapeFillPath = `${vapePathD} L ${vapePoints[vapePoints.length - 1].x} ${height} L ${vapePoints[0].x} ${height} Z`

    return (
      <div className="relative h-48">
        {/* Légende */}
        <div className="absolute top-0 right-0 flex gap-3 text-xs z-20">
          <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-red-300">Cigarettes</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-cyan-300">Vape</span>
          </div>
        </div>

        {/* SVG avec les deux courbes */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cigGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.05 }} />
            </linearGradient>
            <linearGradient id="vapeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>

          {/* Remplissage vape (en arrière) */}
          <path d={vapeFillPath} fill="url(#vapeGradient)" />
          {/* Ligne vape */}
          <path
            d={vapePathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Remplissage cigarettes (au-dessus) */}
          <path d={cigFillPath} fill="url(#cigGradient)" />
          {/* Ligne cigarettes */}
          <path
            d={cigPathD}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Points interactifs */}
        <div className="absolute inset-0 flex items-end justify-between">
          {data.map((item, index) => {
            const cigValue = item.cigarettes_count || 0
            const vapeValue = item.vape_puffs || 0
            const date = new Date(item.entry_date)
            const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'short' })
            const cigPoint = cigPoints[index]
            const vapePoint = vapePoints[index]
            const cigYPercent = ((height - cigPoint.y) / height) * 100
            const vapeYPercent = ((height - vapePoint.y) / height) * 100

            return (
              <div key={index} className="flex-1 flex flex-col items-center relative" style={{ height: '100%' }}>
                {/* Point cigarettes (rouge) */}
                <div
                  className="absolute cursor-pointer z-10"
                  style={{ bottom: `${cigYPercent}%`, left: '50%', transform: 'translate(-50%, 50%)' }}
                  onMouseEnter={() => setHoveredPoint(`cig-${index}`)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div className={`w-3 h-3 rounded-full bg-red-500 transition-all duration-300 ${hoveredPoint === `cig-${index}` ? 'scale-150 ring-4 ring-red-500/50' : 'scale-100'}`} />
                  {hoveredPoint === `cig-${index}` && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {cigValue} cig
                    </div>
                  )}
                </div>

                {/* Point vape (cyan) */}
                <div
                  className="absolute cursor-pointer z-10"
                  style={{ bottom: `${vapeYPercent}%`, left: '50%', transform: 'translate(-50%, 50%)' }}
                  onMouseEnter={() => setHoveredPoint(`vape-${index}`)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div className={`w-3 h-3 rounded-full bg-cyan-500 transition-all duration-300 ${hoveredPoint === `vape-${index}` ? 'scale-150 ring-4 ring-cyan-500/50' : 'scale-100'}`} />
                  {hoveredPoint === `vape-${index}` && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {vapeValue} bouff.
                    </div>
                  )}
                </div>

                {/* Label du jour */}
                <span className="text-xs text-purple-300 mt-auto pt-2">{dayLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Mode simple (cigarettes OU vape uniquement)
  // Calculer la valeur max pour l'échelle
  let maxValue
  const values = trackingType === 'cigarettes'
    ? data.map(d => d.cigarettes_count || 0)
    : data.map(d => d.vape_puffs || 0)

  const maxData = Math.max(...values)
  if (trackingType === 'cigarettes') {
    maxValue = maxData === 0 ? 20 : Math.max(maxData * 1.2, 10)
  } else {
    maxValue = maxData === 0 ? 100 : Math.max(maxData * 1.2, 50)
  }

  // Calculer les points pour la courbe
  const points = data.map((item, index) => {
    const value = trackingType === 'cigarettes'
      ? (item.cigarettes_count || 0)
      : (item.vape_puffs || 0)
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value / maxValue) * (height - 2 * padding))
    return { x, y, value, date: item.entry_date }
  })

  // Créer le path de la courbe avec des courbes quadratiques lisses
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

  // Créer le path pour le remplissage sous la courbe
  const fillPath = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div className="relative h-48">
      {/* SVG pour la courbe */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="consumptionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.05 }} />
          </linearGradient>
          <linearGradient id="consumptionLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Remplissage sous la courbe */}
        <path
          d={fillPath}
          fill="url(#consumptionGradient)"
        />

        {/* Ligne de la courbe */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#consumptionLineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Points interactifs */}
      <div className="absolute inset-0 flex items-end justify-between">
        {data.map((item, index) => {
          const value = trackingType === 'cigarettes'
            ? (item.cigarettes_count || 0)
            : (item.vape_puffs || 0)
          const date = new Date(item.entry_date)
          const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'short' })
          const point = points[index]
          const yPercent = ((height - point.y) / height) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center relative" style={{ height: '100%' }}>
              {/* Point interactif */}
              <div
                className="absolute cursor-pointer z-10"
                style={{ bottom: `${yPercent}%`, left: '50%', transform: 'translate(-50%, 50%)' }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 transition-all duration-300 ${hoveredPoint === index ? 'scale-150 ring-4 ring-purple-500/50' : 'scale-100'}`} />

                {/* Tooltip */}
                {hoveredPoint === index && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {value} {trackingType === 'cigarettes' ? 'cig' : 'bouff.'}
                  </div>
                )}
              </div>

              {/* Label du jour */}
              <span className="text-xs text-purple-300 mt-auto pt-2">{dayLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Graphique d'activités physiques
function ActivityChart({ data }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-purple-300 text-sm">
        Aucune donnée pour le moment.<br/>Remplis ton tracker pour voir ton évolution !
      </div>
    )
  }

  const values = data.map(d => d.physical_activity_minutes || 0)
  const maxData = Math.max(...values)
  const maxValue = maxData === 0 ? 30 : Math.max(maxData * 1.2, 15)

  // Dimensions du graphique
  const width = 100
  const height = 100
  const padding = 10

  // Calculer les points pour la courbe
  const points = data.map((item, index) => {
    const value = item.physical_activity_minutes || 0
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value / maxValue) * (height - 2 * padding))
    return { x, y, value, date: item.entry_date }
  })

  // Créer le path de la courbe avec des courbes quadratiques lisses
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

  // Créer le path pour le remplissage sous la courbe
  const fillPath = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div className="relative h-48">
      {/* SVG pour la courbe */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.05 }} />
          </linearGradient>
          <linearGradient id="activityLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Remplissage sous la courbe */}
        <path
          d={fillPath}
          fill="url(#activityGradient)"
        />

        {/* Ligne de la courbe */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#activityLineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Points interactifs */}
      <div className="absolute inset-0 flex items-end justify-between">
        {data.map((item, index) => {
          const value = item.physical_activity_minutes || 0
          const date = new Date(item.entry_date)
          const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'short' })
          const point = points[index]
          const yPercent = ((height - point.y) / height) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center relative" style={{ height: '100%' }}>
              {/* Point interactif */}
              <div
                className="absolute cursor-pointer z-10"
                style={{ bottom: `${yPercent}%`, left: '50%', transform: 'translate(-50%, 50%)' }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 transition-all duration-300 ${hoveredPoint === index ? 'scale-150 ring-4 ring-emerald-500/50' : 'scale-100'}`} />

                {/* Tooltip */}
                {hoveredPoint === index && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {value} min
                  </div>
                )}
              </div>

              {/* Label du jour */}
              <span className="text-xs text-purple-300 mt-auto pt-2">{dayLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant Widget Objectif du jour
function DailyGoalWidget({ user, profile, todayEntry }) {
  const [currentGoal, setCurrentGoal] = useState(null)
  const [goalProgress, setGoalProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGoal = async () => {
      if (!profile?.current_daily_goal_id) {
        setLoading(false)
        return
      }

      try {
        // Charger le template de l'objectif
        const { data: goalTemplate } = await supabase
          .from('daily_goal_templates')
          .select('*')
          .eq('id', profile.current_daily_goal_id)
          .single()

        setCurrentGoal(goalTemplate)

        // Vérifier si l'objectif est déjà complété aujourd'hui
        const today = new Date().toISOString().split('T')[0]
        const { data: todayGoalHistory } = await supabase
          .from('daily_goal_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('goal_date', today)
          .single()

        // Calculer la progression si on a une entrée aujourd'hui
        if (todayEntry && goalTemplate) {
          let isCompleted = false
          let progressText = ''

          switch (goalTemplate.category) {
            case 'reduction':
              // Si le profil est "both", gérer selon le type d'objectif
              if (profile.quit_type === 'both') {
                if (goalTemplate.target_type === 'cigarettes') {
                  const count = todayEntry.cigarettes_count || 0
                  const max = goalTemplate.max_cigarettes
                  isCompleted = count <= max
                  progressText = `${count}/${max} cigarettes`
                } else if (goalTemplate.target_type === 'vape') {
                  const count = todayEntry.vape_puffs || 0
                  const max = goalTemplate.max_vape_puffs
                  isCompleted = count <= max
                  progressText = `${count}/${max} bouffées`
                } else if (goalTemplate.target_type === 'both') {
                  const cigCount = todayEntry.cigarettes_count || 0
                  const vapeCount = todayEntry.vape_puffs || 0
                  const cigMax = goalTemplate.max_cigarettes || 999
                  const vapeMax = goalTemplate.max_vape_puffs || 999
                  isCompleted = cigCount <= cigMax && vapeCount <= vapeMax
                  progressText = `${cigCount}/${cigMax} cig, ${vapeCount}/${vapeMax} bouff.`
                }
              } else if (goalTemplate.target_type === 'cigarettes' || (goalTemplate.target_type === 'both' && profile.quit_type === 'cigarettes')) {
                const count = todayEntry.cigarettes_count || 0
                const max = goalTemplate.max_cigarettes
                isCompleted = count <= max
                progressText = `${count}/${max} cigarettes`
              } else if (goalTemplate.target_type === 'vape' || (goalTemplate.target_type === 'both' && profile.quit_type === 'vape')) {
                const count = todayEntry.vape_puffs || 0
                const max = goalTemplate.max_vape_puffs
                isCompleted = count <= max
                progressText = `${count}/${max} bouffées`
              }
              break

            case 'time':
              // Pour vérifier les objectifs temporels, il faudrait tracker l'heure de la première consommation
              // Pour l'instant, on affiche juste l'objectif
              progressText = `Pas de consommation avant ${goalTemplate.no_smoking_before_hour}h`
              break

            default:
              progressText = goalTemplate.description
              break
          }

          setGoalProgress({
            isCompleted: todayGoalHistory?.completed || isCompleted,
            progressText,
          })
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement de l\'objectif:', error)
        setLoading(false)
      }
    }

    loadGoal()
  }, [user, profile, todayEntry])

  if (loading) {
    return null
  }

  // Si pas d'objectif, afficher un bouton pour en choisir un
  if (!currentGoal) {
    return (
      <Link
        href="/daily-goals"
        className="backdrop-blur-xl bg-gradient-to-br from-fuchsia-500/40 to-purple-500/40 border border-fuchsia-500/30 rounded-[18px] p-5 mb-6 block group hover:from-fuchsia-500/60 hover:to-purple-500/60 shadow-[0_8px_32px_rgba(217,70,239,0.15)] hover:shadow-[0_8px_40px_rgba(217,70,239,0.25)] transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl group-hover:scale-110 transition-transform">🎯</div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Objectif du jour</h3>
              <p className="text-fuchsia-200 text-sm">Choisis un objectif pour aujourd'hui</p>
            </div>
          </div>
          <div className="text-fuchsia-200 text-3xl group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </Link>
    )
  }

  // Si objectif existe, l'afficher avec progression
  // Calculer le pourcentage de progression pour les objectifs de réduction
  let progressPercent = 0
  if (currentGoal.category === 'reduction' && todayEntry) {
    if (profile.quit_type === 'both') {
      if (currentGoal.target_type === 'cigarettes') {
        const count = todayEntry.cigarettes_count || 0
        const max = currentGoal.max_cigarettes || 1
        progressPercent = Math.min((count / max) * 100, 100)
      } else if (currentGoal.target_type === 'vape') {
        const count = todayEntry.vape_puffs || 0
        const max = currentGoal.max_vape_puffs || 1
        progressPercent = Math.min((count / max) * 100, 100)
      }
    } else if (currentGoal.target_type === 'cigarettes' || (currentGoal.target_type === 'both' && profile.quit_type === 'cigarettes')) {
      const count = todayEntry.cigarettes_count || 0
      const max = currentGoal.max_cigarettes || 1
      progressPercent = Math.min((count / max) * 100, 100)
    } else if (currentGoal.target_type === 'vape' || (currentGoal.target_type === 'both' && profile.quit_type === 'vape')) {
      const count = todayEntry.vape_puffs || 0
      const max = currentGoal.max_vape_puffs || 1
      progressPercent = Math.min((count / max) * 100, 100)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 border border-fuchsia-500/40 rounded-[18px] p-7 mb-8 shadow-[0_8px_32px_rgba(217,70,239,0.15)] hover:shadow-[0_8px_40px_rgba(217,70,239,0.25)] transition-shadow duration-300">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{currentGoal.icon || '🎯'}</div>
          <div>
            <h3 className="text-sm font-medium text-fuchsia-200 mb-1">Objectif du jour</h3>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-white">{currentGoal.title}</p>
              {goalProgress?.isCompleted && (
                <span className="text-xl">✅</span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/daily-goals"
          className="px-3 py-1.5 bg-white/10 border border-white/20 text-fuchsia-100 rounded-[12px] text-xs hover:bg-white/20 hover:shadow-[0_0_16px_rgba(217,70,239,0.3)] transition-all hover:scale-105"
        >
          Changer
        </Link>
      </div>

      {goalProgress && !goalProgress.isCompleted && currentGoal.category === 'reduction' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-fuchsia-100 font-medium">{goalProgress.progressText}</span>
            <span className="text-fuchsia-300 text-xs">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent <= 100 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-red-500 to-orange-500'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {goalProgress && !goalProgress.isCompleted && currentGoal.category !== 'reduction' && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-fuchsia-100 text-sm">{goalProgress.progressText}</span>
            <span className="text-fuchsia-300 text-xs">En cours...</span>
          </div>
        </div>
      )}

      {goalProgress?.isCompleted && (
        <div className="bg-emerald-500/30 border border-emerald-400/40 rounded-xl p-4">
          <p className="text-emerald-100 text-sm font-medium flex items-center gap-2">
            <span className="text-xl">🎉</span>
            Objectif accompli ! <span className="text-fuchsia-300 font-bold">+{currentGoal.points_reward} pts</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weekData, setWeekData] = useState([])
  const [isSchemaLoading, setIsSchemaLoading] = useState(false)
  const [userBadges, setUserBadges] = useState([])
  const [stats, setStats] = useState({
    currentStreak: 0,
    totalMoneySaved: 0,
    todayEntry: null,
  })

  const getLevelLabel = (level) => {
    switch(level) {
      case 'beginner': return '🌱 Débutant'
      case 'explorer': return '🔍 Explorateur'
      case 'champion': return '🏆 Champion'
      case 'master': return '👑 Maître'
      default: return level || 'Débutant'
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Vérifier si le profil existe et est complet
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError)
          if (profileError.code === 'PGRST116') {
            router.push('/onboarding')
            return
          }
        }

        if (profileData && !profileData.onboarding_completed) {
          router.push('/onboarding')
          return
        }

        setProfile(profileData)

        // Charger les badges de l'utilisateur
        const { data: badgesData } = await supabase
          .from('user_badges')
          .select('*, badge:badges(*)')
          .eq('user_id', user.id)

        setUserBadges(badgesData || [])

        // Récupérer les 7 derniers jours d'entrées
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

        let entriesData = null
        let entriesError = null
        let isSchemaError = false

        try {
          const result = await supabase
            .from('daily_entries')
            .select('*')
            .eq('user_id', user.id)
            .gte('entry_date', sevenDaysAgoStr)
            .order('entry_date', { ascending: true })

          entriesData = result.data
          entriesError = result.error
        } catch (error) {
          console.error('Erreur lors de la récupération des entrées:', error)
          entriesError = error
        }

        // Détecter l'erreur de cache du schéma
        if (entriesError && (
          entriesError.message?.includes('schema cache') ||
          entriesError.message?.includes('tracking_type') ||
          entriesError.code === 'PGRST204'
        )) {
          isSchemaError = true
          setIsSchemaLoading(true)

          // Créer des données vides en attendant le refresh
          const fullWeekData = []
          for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const dateStr = date.toISOString().split('T')[0]
            fullWeekData.push({
              entry_date: dateStr,
              cigarettes_count: 0,
              vape_puffs: 0,
              physical_activity_minutes: 0,
              tracking_type: profileData.quit_type === 'both' ? 'both' : (profileData.quit_type === 'vape' ? 'vape' : 'cigarettes')
            })
          }
          setWeekData(fullWeekData)
          setStats({
            currentStreak: 0,
            totalMoneySaved: 0,
            todayEntry: null,
          })
        } else if (entriesError) {
          console.error('Erreur lors de la récupération des entrées:', entriesError)
          // Créer des données vides par défaut
          const fullWeekData = []
          for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const dateStr = date.toISOString().split('T')[0]
            fullWeekData.push({
              entry_date: dateStr,
              cigarettes_count: 0,
              vape_puffs: 0,
              physical_activity_minutes: 0,
              tracking_type: profileData.quit_type === 'both' ? 'both' : (profileData.quit_type === 'vape' ? 'vape' : 'cigarettes')
            })
          }
          setWeekData(fullWeekData)
        } else {
          // Créer un tableau avec tous les 7 jours (remplir avec des données vides si nécessaire)
          const fullWeekData = []
          for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const dateStr = date.toISOString().split('T')[0]

            const entry = entriesData?.find(e => e.entry_date === dateStr)
            const dayData = entry || {
              entry_date: dateStr,
              cigarettes_count: 0,
              vape_puffs: 0,
              physical_activity_minutes: 0,
              tracking_type: profileData.quit_type === 'both' ? 'both' : (profileData.quit_type === 'vape' ? 'vape' : 'cigarettes')
            }
            fullWeekData.push(dayData)
          }

          setWeekData(fullWeekData)

          // Calculer les stats
          const todayStr = new Date().toISOString().split('T')[0]
          const todayEntry = entriesData?.find(e => e.entry_date === todayStr)

          const totalSaved = entriesData?.reduce((sum, entry) => sum + (parseFloat(entry.money_saved) || 0), 0) || 0

          // Calculer le streak (jours consécutifs avec réduction)
          let streak = 0
          const sortedEntries = [...(entriesData || [])].reverse()
          for (const entry of sortedEntries) {
            const hasReduction = profileData.quit_type === 'cigarettes'
              ? (entry.cigarettes_count < profileData.cigarettes_per_day_baseline)
              : (entry.vape_puffs < 200) // Simplified

            if (hasReduction) {
              streak++
            } else {
              break
            }
          }

          setStats({
            currentStreak: streak,
            totalMoneySaved: totalSaved,
            todayEntry,
          })
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur inattendue:', error)
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-xl text-purple-300 animate-pulse">Chargement...</div>
      </div>
    )
  }

  const trackingType = weekData.find(d => d.tracking_type)?.tracking_type || 'cigarettes'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0612] via-[#1a0d2e] to-[#0d0520] text-white pb-24">
      {/* Background Elements */}
      <StarField />

      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[450px] h-[450px] bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-[120px] opacity-40" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[350px] h-[350px] bg-gradient-to-br from-pink-600 to-purple-600 rounded-full blur-[120px] opacity-40" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg">
              🌿
            </div>
            <span className="text-lg font-bold text-white">Smart Stop</span>
          </div>

          {/* Badges accumulés */}
          <Link
            href="/badges"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
          >
            <span className="text-xl">🏆</span>
            <div className="flex flex-col">
              <span className="text-xs text-purple-300">Badges</span>
              <span className="text-sm font-bold text-white">{userBadges.length}</span>
            </div>
          </Link>

          {/* Menu Profil avec déconnexion */}
          <ProfileMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Welcome + Encouragement */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-purple-300 text-sm mb-1">Bonjour {profile?.first_name || 'toi'} 👋</p>
                <h1 className="text-xl font-bold text-white">
                  {stats.currentStreak > 0 ? 'Tu fais du bon travail !' : 'Bienvenue sur ton dashboard !'}
                </h1>
              </div>
              {stats.currentStreak > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    {stats.currentStreak}
                  </div>
                  <div className="text-purple-300 text-xs">jours de série 🔥</div>
                </div>
              )}
            </div>

            {stats.totalMoneySaved > 0 && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-300 text-sm">
                  💰 <strong>{stats.totalMoneySaved.toFixed(2)}€</strong> économisés au total !
                </p>
              </div>
            )}

            {!stats.todayEntry && !isSchemaLoading && (
              <div className="mt-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-3">
                <p className="text-cyan-300 text-sm">
                  📊 N'oublie pas de remplir ton tracker aujourd'hui !
                </p>
              </div>
            )}
          </div>

          {/* Widget Objectif du jour */}
          <DailyGoalWidget user={user} profile={profile} todayEntry={stats.todayEntry} />

          {/* Message de chargement du cache */}
          {isSchemaLoading && (
            <div className="backdrop-blur-xl bg-amber-500/20 border border-amber-500/30 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <h3 className="text-amber-200 font-semibold mb-1">Initialisation en cours...</h3>
                  <p className="text-amber-300/90 text-sm mb-2">
                    Le tracker se charge pour la première fois. Cela peut prendre 1-2 minutes.
                  </p>
                  <p className="text-amber-300/70 text-xs">
                    💡 Rafraîchis la page dans quelques instants pour voir tes données.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Graphiques côte à côté */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {/* Graphique Consommation */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[18px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                  <span>{trackingType === 'both' ? '🚬💨' : (trackingType === 'cigarettes' ? '🚬' : '💨')}</span>
                  Consommation
                </h2>
                <span className="text-purple-300 text-xs">7 jours</span>
              </div>
              {weekData.length >= 2 && getProgressMessage(weekData, 'consumption') && (
                <div className={`text-sm font-medium mb-3 ${getProgressMessage(weekData, 'consumption').color}`}>
                  {getProgressMessage(weekData, 'consumption').text}
                </div>
              )}
              <ConsumptionChart data={weekData} userProfile={profile} />
            </div>

            {/* Graphique Activités */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[18px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                  <span>🏃</span>
                  Activités
                </h2>
                <span className="text-purple-300 text-xs">7 jours</span>
              </div>
              {weekData.length >= 2 && getProgressMessage(weekData, 'activity') && (
                <div className={`text-sm font-medium mb-3 ${getProgressMessage(weekData, 'activity').color}`}>
                  {getProgressMessage(weekData, 'activity').text}
                </div>
              )}
              <ActivityChart data={weekData} />
            </div>
          </div>

          {/* Action Buttons - 3 boutons en haut */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Tracker */}
            <Link
              href="/tracker"
              className="backdrop-blur-xl bg-gradient-to-br from-purple-600/50 to-cyan-600/50 border border-purple-400/30 rounded-[18px] p-5 text-center group hover:from-purple-600/70 hover:to-cyan-600/70 hover:scale-105 shadow-[0_4px_20px_rgba(168,85,247,0.2)] hover:shadow-[0_6px_28px_rgba(168,85,247,0.35)] transition-all duration-300"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-base font-bold text-white mb-1 tracking-tight">Tracker</h3>
              <p className="text-purple-200 text-xs leading-relaxed">Noter ma journée</p>
            </Link>

            {/* Journal */}
            <Link
              href="/journal"
              className="backdrop-blur-xl bg-gradient-to-br from-fuchsia-600/50 to-purple-600/50 border border-fuchsia-400/30 rounded-[18px] p-5 text-center group hover:from-fuchsia-600/70 hover:to-purple-600/70 hover:scale-105 shadow-[0_4px_20px_rgba(217,70,239,0.25)] hover:shadow-[0_6px_32px_rgba(217,70,239,0.4)] transition-all duration-300"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📓</div>
              <h3 className="text-base font-bold text-white mb-1 tracking-tight">Journal</h3>
              <p className="text-fuchsia-200 text-xs leading-relaxed">Mes pensées</p>
            </Link>

            {/* Stats */}
            <Link
              href="/stats"
              className="backdrop-blur-xl bg-gradient-to-br from-orange-600/50 to-amber-600/50 border border-orange-400/30 rounded-[18px] p-5 text-center group hover:from-orange-600/70 hover:to-amber-600/70 hover:scale-105 shadow-[0_4px_20px_rgba(249,115,22,0.2)] hover:shadow-[0_6px_28px_rgba(249,115,22,0.35)] transition-all duration-300"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📈</div>
              <h3 className="text-base font-bold text-white mb-1 tracking-tight">Stats</h3>
              <p className="text-orange-200 text-xs leading-relaxed">Progression</p>
            </Link>
          </div>

          {/* Espace Bien-Être - Pleine largeur */}
          <Link
            href="/exercises"
            className="backdrop-blur-xl bg-gradient-to-br from-emerald-600/50 to-teal-600/50 border border-emerald-400/30 rounded-[18px] p-6 text-left group hover:from-emerald-600/70 hover:to-teal-600/70 hover:scale-[1.02] shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_28px_rgba(16,185,129,0.35)] transition-all duration-300 mb-6 block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl group-hover:scale-110 transition-transform">🧘</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Espace Bien-Être</h3>
                  <p className="text-emerald-200 text-sm">Méditation, yoga et fitness pour m'accompagner</p>
                </div>
              </div>
              <div className="text-emerald-200 text-3xl group-hover:translate-x-1 transition-transform">→</div>
            </div>
          </Link>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Points */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[18px] p-4 hover:bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">
                  ⭐
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-400">{profile?.points || 0} pts</div>
                  <div className="text-purple-300 text-xs">Niveau : {getLevelLabel(profile?.level)}</div>
                </div>
              </div>
            </div>

            {/* Activité du jour */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[18px] p-4 hover:bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">
                  🏃
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-400">
                    {stats.todayEntry?.physical_activity_minutes || 0} min
                  </div>
                  <div className="text-purple-300 text-xs">Sport aujourd'hui</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Communauté */}
          <div className="mt-6 backdrop-blur-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/40 rounded-[18px] p-6 shadow-[0_4px_24px_rgba(168,85,247,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                <span>👥</span>
                Communauté Smart Stop
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Partages aujourd'hui */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🤝</div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {Math.floor(Math.random() * 30) + 15}
                    </div>
                    <div className="text-purple-300 text-xs">Partages aujourd'hui</div>
                  </div>
                </div>
              </div>

              {/* Utilisateurs actifs */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⭐</div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {Math.floor(Math.random() * 100) + 50}
                    </div>
                    <div className="text-purple-300 text-xs">Utilisateurs actifs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Voir la communauté */}
            <Link
              href="/community"
              className="mt-4 w-full bg-gradient-to-r from-purple-600/50 to-pink-600/50 border border-purple-500/50 rounded-[16px] p-3 text-center text-white font-medium hover:from-purple-600/70 hover:to-pink-600/70 shadow-[0_4px_16px_rgba(217,70,239,0.2)] hover:shadow-[0_6px_24px_rgba(217,70,239,0.35)] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Rejoindre la communauté
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* SOS Button */}
      <SOSButton />
    </div>
  )
}
