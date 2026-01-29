'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SOSButton() {
  const pathname = usePathname()

  // Ne pas afficher sur les pages de login/signup
  if (pathname === '/login' || pathname === '/signup' || pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <Link
      href="/sos"
      className="fixed bottom-20 right-4 z-50 group"
    >
      <div className="relative">
        {/* Cercles d'alerte animés */}
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
        <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-50" />

        {/* Bouton principal */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl border-2 border-white/30 group-hover:scale-110 transition-transform">
          <span className="text-3xl animate-bounce">🚨</span>
        </div>

        {/* Label SOS */}
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          SOS
        </div>
      </div>
    </Link>
  )
}
