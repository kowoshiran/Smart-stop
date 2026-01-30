'use client'

import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker enregistré:', registration)
        })
        .catch((error) => {
          console.error('Erreur Service Worker:', error)
        })
    }

    // Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Empêcher le prompt par défaut
      e.preventDefault()
      // Sauvegarder l'événement pour l'utiliser plus tard
      setDeferredPrompt(e)
      // Afficher le bouton d'installation
      setShowInstallButton(true)
    }

    // Écouter l'événement
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Afficher le prompt d'installation
    deferredPrompt.prompt()

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('Installation acceptée')
    } else {
      console.log('Installation refusée')
    }

    // Réinitialiser le prompt
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  if (!showInstallButton) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in">
      <div className="backdrop-blur-xl bg-gradient-to-r from-fuchsia-500/90 to-purple-600/90 border border-fuchsia-400/50 rounded-2xl p-4 shadow-[0_8px_32px_rgba(217,70,239,0.4)]">
        <div className="flex items-center gap-4">
          <div className="text-4xl">📱</div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              Installer Smart Stop
            </h3>
            <p className="text-purple-100 text-sm">
              Accède à l'app depuis ton écran d'accueil
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-5 py-2.5 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all hover:scale-105 shadow-lg"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  )
}
