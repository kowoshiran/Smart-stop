import { supabase } from './supabase'

/**
 * Vérifie et valide automatiquement l'objectif du jour d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} todayEntry - L'entrée tracker du jour
 * @returns {Promise<Object>} - Résultat de la validation
 */
export async function checkAndValidateDailyGoal(userId, todayEntry) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Erreur profil:', profileError)
      return { success: false, error: 'Profil non trouvé' }
    }

    // Si pas d'objectif actif, on ne fait rien
    if (!profile.current_daily_goal_id) {
      return { success: true, noGoal: true }
    }

    // 2. Récupérer le template de l'objectif
    const { data: goalTemplate, error: goalError } = await supabase
      .from('daily_goal_templates')
      .select('*')
      .eq('id', profile.current_daily_goal_id)
      .single()

    if (goalError || !goalTemplate) {
      console.error('Erreur objectif:', goalError)
      return { success: false, error: 'Objectif non trouvé' }
    }

    // 3. Vérifier si l'objectif est déjà validé aujourd'hui
    const { data: existingHistory } = await supabase
      .from('daily_goal_history')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', today)
      .single()

    if (existingHistory?.completed) {
      return { success: true, alreadyCompleted: true }
    }

    // 4. Valider selon le type d'objectif
    let isCompleted = false
    let validationDetails = ''

    switch (goalTemplate.category) {
      case 'reduction':
        isCompleted = validateReductionGoal(goalTemplate, todayEntry, profile)
        if (isCompleted) {
          if (goalTemplate.target_type === 'cigarettes' || profile.quit_type === 'cigarettes') {
            validationDetails = `${todayEntry.cigarettes_count || 0}/${goalTemplate.max_cigarettes} cigarettes`
          } else {
            validationDetails = `${todayEntry.vape_puffs || 0}/${goalTemplate.max_vape_puffs} bouffées`
          }
        }
        break

      case 'time':
        // Pour les objectifs temporels, on devrait tracker l'heure de la première consommation
        // Pour l'instant, on considère que c'est validé si l'utilisateur a consommé moins que sa baseline
        isCompleted = validateTimeGoal(goalTemplate, todayEntry, profile)
        validationDetails = `Objectif temporel respecté`
        break

      case 'period':
        // Similaire aux objectifs temporels
        isCompleted = validatePeriodGoal(goalTemplate, todayEntry, profile)
        validationDetails = `Période sans consommation respectée`
        break

      case 'spacing':
        // Pour les objectifs d'espacement, on devrait tracker les heures de chaque consommation
        // Pour l'instant, on considère validé si consommation réduite
        isCompleted = validateSpacingGoal(goalTemplate, todayEntry, profile)
        validationDetails = `Espacement respecté`
        break

      case 'context':
        // Pour les objectifs contextuels, on devrait tracker les lieux de consommation
        // Pour l'instant, on considère validé si consommation réduite
        isCompleted = validateContextGoal(goalTemplate, todayEntry, profile)
        validationDetails = `Contexte respecté`
        break

      default:
        return { success: false, error: 'Type d\'objectif inconnu' }
    }

    // 5. Mettre à jour ou créer l'historique
    if (isCompleted) {
      const { error: historyError } = await supabase
        .from('daily_goal_history')
        .upsert({
          user_id: userId,
          goal_template_id: goalTemplate.id,
          goal_date: today,
          completed: true,
          completed_at: new Date().toISOString(),
          points_earned: goalTemplate.points_reward,
        }, {
          onConflict: 'user_id,goal_date'
        })

      if (historyError) {
        console.error('Erreur historique:', historyError)
        return { success: false, error: 'Erreur lors de la mise à jour de l\'historique' }
      }

      // Ajouter les points au profil
      await addPointsToProfile(userId, goalTemplate.points_reward)

      // Incrémenter le compteur d'objectifs complétés
      await supabase
        .from('profiles')
        .update({
          total_daily_goals_completed: (profile.total_daily_goals_completed || 0) + 1,
          daily_goal_last_completion_date: today,
        })
        .eq('id', userId)

      return {
        success: true,
        completed: true,
        goalTitle: goalTemplate.title,
        pointsEarned: goalTemplate.points_reward,
        details: validationDetails,
      }
    }

    return {
      success: true,
      completed: false,
      goalTitle: goalTemplate.title,
    }

  } catch (error) {
    console.error('Erreur lors de la validation:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Valide un objectif de type réduction
 */
function validateReductionGoal(goalTemplate, todayEntry, profile) {
  if (!todayEntry) return false

  // Si le profil est "both", valider selon le type d'objectif
  if (profile.quit_type === 'both') {
    if (goalTemplate.target_type === 'cigarettes') {
      const count = todayEntry.cigarettes_count || 0
      const max = goalTemplate.max_cigarettes
      return count <= max
    } else if (goalTemplate.target_type === 'vape') {
      const count = todayEntry.vape_puffs || 0
      const max = goalTemplate.max_vape_puffs
      return count <= max
    } else if (goalTemplate.target_type === 'both') {
      // Pour un objectif "both", valider que les deux sont respectés
      const cigCount = todayEntry.cigarettes_count || 0
      const vapeCount = todayEntry.vape_puffs || 0
      const cigMax = goalTemplate.max_cigarettes || 999
      const vapeMax = goalTemplate.max_vape_puffs || 999
      return cigCount <= cigMax && vapeCount <= vapeMax
    }
  }

  if (goalTemplate.target_type === 'cigarettes' || (goalTemplate.target_type === 'both' && profile.quit_type === 'cigarettes')) {
    const count = todayEntry.cigarettes_count || 0
    const max = goalTemplate.max_cigarettes
    return count <= max
  }

  if (goalTemplate.target_type === 'vape' || (goalTemplate.target_type === 'both' && profile.quit_type === 'vape')) {
    const count = todayEntry.vape_puffs || 0
    const max = goalTemplate.max_vape_puffs
    return count <= max
  }

  return false
}

/**
 * Valide un objectif de type temporel
 * Note: Pour une vraie validation, il faudrait tracker l'heure de la première consommation
 */
function validateTimeGoal(goalTemplate, todayEntry, profile) {
  if (!todayEntry) return false

  // Simplification: on considère l'objectif réussi si la consommation est réduite
  if (profile.quit_type === 'cigarettes') {
    const count = todayEntry.cigarettes_count || 0
    const baseline = profile.cigarettes_per_day_baseline || 20
    return count < baseline * 0.8 // 20% de réduction minimum
  } else {
    const count = todayEntry.vape_puffs || 0
    const baselineMap = { heavy: 300, moderate: 200, light: 100 }
    const baseline = baselineMap[profile.vape_frequency_baseline] || 200
    return count < baseline * 0.8
  }
}

/**
 * Valide un objectif de type période
 */
function validatePeriodGoal(goalTemplate, todayEntry, profile) {
  // Similaire aux objectifs temporels pour l'instant
  return validateTimeGoal(goalTemplate, todayEntry, profile)
}

/**
 * Valide un objectif d'espacement
 */
function validateSpacingGoal(goalTemplate, todayEntry, profile) {
  // Similaire aux objectifs temporels pour l'instant
  return validateTimeGoal(goalTemplate, todayEntry, profile)
}

/**
 * Valide un objectif contextuel
 */
function validateContextGoal(goalTemplate, todayEntry, profile) {
  // Similaire aux objectifs temporels pour l'instant
  return validateTimeGoal(goalTemplate, todayEntry, profile)
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
        level: newLevel,
      })
      .eq('id', userId)

  } catch (error) {
    console.error('Erreur lors de l\'ajout de points:', error)
  }
}

/**
 * Récupère l'historique des objectifs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limit - Nombre de jours à récupérer
 * @returns {Promise<Array>} - Historique des objectifs
 */
export async function getDailyGoalHistory(userId, limit = 30) {
  try {
    const { data, error } = await supabase
      .from('daily_goal_history')
      .select('*, goal_template:daily_goal_templates(*)')
      .eq('user_id', userId)
      .order('goal_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erreur historique:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur:', error)
    return []
  }
}

/**
 * Récupère les statistiques d'objectifs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Statistiques
 */
export async function getDailyGoalStats(userId) {
  try {
    const { data: history } = await supabase
      .from('daily_goal_history')
      .select('*')
      .eq('user_id', userId)

    if (!history || history.length === 0) {
      return {
        totalAttempts: 0,
        totalCompleted: 0,
        completionRate: 0,
        totalPointsEarned: 0,
        currentStreak: 0,
      }
    }

    const totalAttempts = history.length
    const totalCompleted = history.filter(h => h.completed).length
    const completionRate = (totalCompleted / totalAttempts) * 100
    const totalPointsEarned = history.reduce((sum, h) => sum + (h.points_earned || 0), 0)

    // Calculer le streak actuel
    let currentStreak = 0
    const sortedHistory = [...history].sort((a, b) => new Date(b.goal_date) - new Date(a.goal_date))

    for (const entry of sortedHistory) {
      if (entry.completed) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalAttempts,
      totalCompleted,
      completionRate: Math.round(completionRate),
      totalPointsEarned,
      currentStreak,
    }
  } catch (error) {
    console.error('Erreur stats:', error)
    return {
      totalAttempts: 0,
      totalCompleted: 0,
      completionRate: 0,
      totalPointsEarned: 0,
      currentStreak: 0,
    }
  }
}
