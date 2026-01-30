'use client'

import { useState } from 'react'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InstallPrompt from '@/components/InstallPrompt'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        }
      })

      if (error) throw error

      // Créer le profil dans la table profiles
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Erreur lors de la création du profil:', profileError)
          // On continue quand même, le profil sera créé dans l'onboarding si nécessaire
        }
      }

      setMessage('Compte créé ! Redirection vers l\'onboarding...')

      setTimeout(() => {
        router.push('/onboarding')
      }, 1500)

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
          <h1 className="text-3xl font-bold text-white mb-2">Smart Stop</h1>
          <p className="text-purple-300">Arrête progressivement, à ton rythme 🌱</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-500 transition"
              placeholder="••••••••"
            />
            <p className="text-xs text-purple-300/70 mt-1">Minimum 6 caractères</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création du compte...' : 'Commencer l\'aventure 🚀'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-purple-300">
            Déjà membre ?{' '}
            <Link href="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      <InstallPrompt />
    </div>
  )
}