'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/Lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Si l'utilisateur est connecté, rediriger vers le dashboard
        router.push('/dashboard')
      } else {
        // Sinon, rediriger vers la page de login
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0612] via-[#1a0d2e] to-[#0d0520] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🌿</div>
        <h1 className="text-2xl font-bold text-white mb-2">Smart Stop</h1>
        <p className="text-purple-300">Chargement...</p>
      </div>
    </div>
  )
}
