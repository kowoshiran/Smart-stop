'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/Lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const menuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    // Charger le profil
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    loadProfile()

    // Fermer le menu si on clique en dehors
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton Profil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {profile?.first_name?.[0]?.toUpperCase() || '👤'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-purple-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-[#0a0a0f]/95 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
          {/* Info utilisateur */}
          {profile?.first_name && (
            <div className="px-4 py-2 border-b border-white/10">
              <div className="text-white font-semibold text-sm">
                {profile.first_name}
              </div>
            </div>
          )}

          {/* Lien Profil */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-2 text-purple-200 hover:bg-white/10 hover:text-white transition"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-lg">👤</span>
            <span className="text-sm">Voir le profil</span>
          </Link>

          {/* Séparateur */}
          <div className="border-t border-white/10 my-1" />

          {/* Bouton Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-purple-200 hover:bg-red-500/20 hover:text-red-300 transition"
          >
            <span className="text-lg">🚪</span>
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  )
}
