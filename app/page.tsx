'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/Lib/supabase'

export default function Home() {
  const router = useRouter()
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)

  useEffect(() => {
    // Détecter si l'app est installée (mode standalone)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://')
      setIsInstalled(isStandalone)
      return isStandalone
    }

    // Détecter si on est sur mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
      return mobile
    }

    // Détecter si on est dans un navigateur intégré (Facebook, Messenger, Instagram, etc.)
    const checkInAppBrowser = () => {
      const ua = navigator.userAgent || navigator.vendor
      const isInApp = /FBAN|FBAV|Instagram|Messenger|Line|WhatsApp|Twitter/i.test(ua)
      setIsInAppBrowser(isInApp)
      return isInApp
    }

    const installed = checkInstalled()
    const mobile = checkMobile()
    const inAppBrowser = checkInAppBrowser()

    // Si l'app est installée OU qu'on est sur desktop, continuer normalement
    if (installed || !mobile) {
      checkAuth()
    } else {
      // Sur mobile et pas installé : afficher l'écran d'installation
      setShowInstallPrompt(true)
    }

    // Capturer l'événement beforeinstallprompt pour le bouton d'installation
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si le prompt n'est pas disponible, afficher les instructions manuelles
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
      checkAuth()
    }
  }

  // Écran d'installation pour mobile non installé
  if (showInstallPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0612] via-[#1a0d2e] to-[#0d0520] flex items-center justify-center p-4">
        {/* Orbes colorées */}
        <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-[100px] opacity-30" />
        <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30" />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-6 shadow-2xl">
            <span className="text-5xl">🌿</span>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold text-white mb-3">Smart Stop</h1>
          <p className="text-xl text-purple-300 mb-8">Arrête progressivement, à ton rythme</p>

          {/* Message principal */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-white mb-3">Installe l'application</h2>
            <p className="text-purple-200 mb-6">
              Pour la meilleure expérience, installe Smart Stop sur ton écran d'accueil.
              Tu pourras l'utiliser comme une vraie app, même hors ligne.
            </p>

            {isInAppBrowser ? (
              <div className="text-left space-y-4 text-purple-200">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                  <p className="text-yellow-200 font-semibold mb-2">⚠️ Navigateur non compatible</p>
                  <p className="text-yellow-100 text-sm">
                    Tu es dans un navigateur intégré (Messenger, Facebook, Instagram...).
                    Pour installer l'app, il faut ouvrir ce lien dans Chrome.
                  </p>
                </div>

                <p className="font-semibold text-white">Comment ouvrir dans Chrome :</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <p>Appuie sur <strong>⋮</strong> ou <strong>···</strong> (menu en haut à droite)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <p>Sélectionne <strong>"Ouvrir dans Chrome"</strong> ou <strong>"Ouvrir dans le navigateur"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <p>Une fois dans Chrome, tu verras un bouton <strong>"Installer"</strong></p>
                  </div>
                </div>
              </div>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-cyan-600 transition-all hover:scale-105 shadow-lg mb-4"
              >
                Installer maintenant
              </button>
            ) : (
              <div className="text-left space-y-4 text-purple-200">
                <p className="font-semibold text-white">Comment installer :</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <p>Appuie sur le bouton <strong>menu</strong> de ton navigateur (⋮ ou ···)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <p>Sélectionne <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <p>Confirme l'installation</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">4️⃣</span>
                    <p>Ouvre l'app depuis ton écran d'accueil</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lien de secours pour desktop/accès web */}
          <button
            onClick={() => {
              setShowInstallPrompt(false)
              checkAuth()
            }}
            className="text-purple-300 text-sm hover:text-purple-200 transition"
          >
            Continuer sans installer (non recommandé)
          </button>
        </div>
      </div>
    )
  }

  // Écran de chargement normal
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
