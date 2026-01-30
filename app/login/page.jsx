'use client'

import { useState } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Traduire les erreurs courantes en français
        const errorMessages = {
          'Invalid login credentials': 'Email ou mot de passe incorrect',
          'Email not confirmed': 'Email non confirmé. Vérifie ta boîte mail et clique sur le lien de confirmation.',
          'Invalid email': 'Adresse email invalide',
          'User not found': 'Utilisateur non trouvé',
        }
        throw new Error(errorMessages[error.message] || error.message)
      }

      router.push('/dashboard')

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] flex items-center justify-center p-4">
      {/* Orbes colorées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-[100px] opacity-30" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30" />

      <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-4">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Content de te revoir ! 👋</h1>
          <p className="text-purple-300">Connecte-toi pour continuer</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
              Mot de passe oublié ?
            </Link>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-purple-300">
            Pas encore membre ?{' '}
            <Link href="/signup" className="text-cyan-400 font-semibold hover:text-cyan-300 transition">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}