import { supabase } from './supabase'

/**
 * Vérifie et débloque automatiquement les badges pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des nouveaux badges débloqués
 */
export async function checkAndUnlockBadges(userId) {
  try {
    const newlyUnlocked = []

    // 1. Charger tous les badges
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')

    if (!allBadges) return []

    // 2. Charger les badges déjà débloqués par l'utilisateur
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    const unlockedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])

    // 3. Charger les données de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: dailyEntries } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true })

    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)

    // 4. Vérifier chaque badge
    for (const badge of allBadges) {
      // Skip si déjà débloqué
      if (unlockedBadgeIds.has(badge.id)) continue

      let shouldUnlock = false

      // Vérifier selon le code du badge
      switch (badge.code) {
        // MILESTONES TEMPORELLES
        case 'first_day':
          shouldUnlock = dailyEntries && dailyEntries.length >= 1
          break

        case 'week_streak':
          shouldUnlock = checkConsecutiveDays(dailyEntries, 7)
          break

        case 'month_streak':
          shouldUnlock = checkConsecutiveDays(dailyEntries, 30)
          break

        case 'hundred_days':
          shouldUnlock = checkConsecutiveDays(dailyEntries, 100)
          break

        case 'year_streak':
          shouldUnlock = checkConsecutiveDays(dailyEntries, 365)
          break

        // RÉDUCTION DE CONSOMMATION
        case 'zero_day':
          shouldUnlock = checkZeroConsumptionDays(dailyEntries, 1)
          break

        case 'ten_zero_days':
          shouldUnlock = checkZeroConsumptionDays(dailyEntries, 10)
          break

        case 'half_reduction':
          shouldUnlock = checkHalfReduction(dailyEntries, profile)
          break

        // ACTIONS POSITIVES
        case 'first_sport':
          shouldUnlock = dailyEntries?.some(e => (e.physical_activity_minutes || 0) > 0)
          break

        case 'hundred_min_sport':
          const totalSport = dailyEntries?.reduce((sum, e) => sum + (e.physical_activity_minutes || 0), 0) || 0
          shouldUnlock = totalSport >= 100
          break

        case 'first_journal':
          shouldUnlock = journalEntries && journalEntries.length >= 1
          break

        case 'ten_journals':
          shouldUnlock = journalEntries && journalEntries.length >= 10
          break

        case 'first_meditation':
          shouldUnlock = dailyEntries?.some(e => (e.meditation_minutes || 0) > 0)
          break

        case 'hundred_min_meditation':
          const totalMeditation = dailyEntries?.reduce((sum, e) => sum + (e.meditation_minutes || 0), 0) || 0
          shouldUnlock = totalMeditation >= 100
          break

        // RÉGULARITÉ
        case 'tracker_week':
          shouldUnlock = countTrackerDays(dailyEntries, 7) >= 7
          break

        case 'tracker_month':
          shouldUnlock = countTrackerDays(dailyEntries, 30) >= 30
          break

        default:
          break
      }

      // Si le badge doit être débloqué, l'insérer
      if (shouldUnlock) {
        const { error } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            unlocked_at: new Date().toISOString()
          })

        if (!error) {
          newlyUnlocked.push(badge)

          // Ajouter les points au profil
          await addPointsToProfile(userId, badge.points)
        }
      }
    }

    return newlyUnlocked
  } catch (error) {
    console.error('Erreur lors de la vérification des badges:', error)
    return []
  }
}

/**
 * Vérifie si l'utilisateur a X jours consécutifs de suivi
 */
function checkConsecutiveDays(entries, targetDays) {
  if (!entries || entries.length < targetDays) return false

  // Trier par date
  const sorted = [...entries].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))

  let consecutiveCount = 1
  let maxConsecutive = 1

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].entry_date)
    const currDate = new Date(sorted[i].entry_date)
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      consecutiveCount++
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount)
    } else {
      consecutiveCount = 1
    }
  }

  return maxConsecutive >= targetDays
}

/**
 * Vérifie si l'utilisateur a X jours avec 0 consommation
 */
function checkZeroConsumptionDays(entries, targetDays) {
  if (!entries) return false

  const zeroDays = entries.filter(e => {
    const cigarettes = e.cigarettes_count || 0
    const vape = e.vape_puffs || 0
    return cigarettes === 0 && vape === 0
  })

  return zeroDays.length >= targetDays
}

/**
 * Vérifie si l'utilisateur a réduit de 50% vs baseline
 */
function checkHalfReduction(entries, profile) {
  if (!entries || entries.length === 0 || !profile) return false

  const baseline = profile.cigarettes_per_day_baseline || 0
  if (baseline === 0) return false

  // Calculer la moyenne des 7 derniers jours
  const last7Days = entries.slice(-7)
  if (last7Days.length === 0) return false

  const avgConsumption = last7Days.reduce((sum, e) => sum + (e.cigarettes_count || 0), 0) / last7Days.length

  return avgConsumption <= baseline * 0.5
}

/**
 * Compte le nombre de jours avec tracker rempli dans les X derniers jours
 */
function countTrackerDays(entries, days) {
  if (!entries) return 0

  const today = new Date()
  const targetDate = new Date()
  targetDate.setDate(today.getDate() - days)

  const recentEntries = entries.filter(e => {
    const entryDate = new Date(e.entry_date)
    return entryDate >= targetDate
  })

  return recentEntries.length
}

/**
 * Ajoute des points au profil de l'utilisateur
 */
async function addPointsToProfile(userId, points) {
  try {
    // Récupérer les points actuels
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    const currentPoints = profile?.points || 0
    const newPoints = currentPoints + points

    // Calculer le nouveau niveau
    let newLevel = 'beginner'
    if (newPoints >= 1500) {
      newLevel = 'master'
    } else if (newPoints >= 500) {
      newLevel = 'champion'
    } else if (newPoints >= 100) {
      newLevel = 'explorer'
    }

    // Mettre à jour le profil
    await supabase
      .from('profiles')
      .update({
        points: newPoints,
        level: newLevel
      })
      .eq('id', userId)

  } catch (error) {
    console.error('Erreur lors de l\'ajout de points:', error)
  }
}
