'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BubbleGame() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [bubbles, setBubbles] = useState([])
  const [gameStarted, setGameStarted] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes = 300 secondes
  const [particles, setParticles] = useState([])
  const [motivationMessage, setMotivationMessage] = useState("Continue ! L'envie va bientôt passer 💪")
  const gameAreaRef = useRef(null)

  const motivationMessages = [
    "Continue ! L'envie va bientôt passer 💪",
    "Tu es plus fort que l'envie ! 🔥",
    "Encore quelques minutes... Tu peux le faire ! ⭐",
    "Bravo ! Tu résistes comme un champion ! 🏆",
    "L'envie diminue déjà, tiens bon ! 💎",
    "Chaque bulle éclatée est une victoire ! 🎉",
    "Tu es sur la bonne voie ! 🌟",
    "Force et courage ! ⚡"
  ]

  useEffect(() => {
    // Charger le record
    const savedHighScore = localStorage.getItem('bubble_high_score')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  useEffect(() => {
    if (!gameStarted) return

    // Timer
    const timerInterval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Générer des bulles
    const bubbleInterval = setInterval(() => {
      generateBubble()
    }, 600) // Générer plus fréquemment pour compenser la chute

    // Animation des bulles qui tombent avec mouvement latéral
    const animationInterval = setInterval(() => {
      setBubbles(prevBubbles =>
        prevBubbles.map(bubble => ({
          ...bubble,
          y: bubble.y + bubble.speed,
          x: bubble.x + Math.sin(bubble.wobble) * 0.5,
          wobble: bubble.wobble + 0.05
        }))
      )
    }, 16) // ~60 FPS

    // Changer le message de motivation toutes les 10 secondes
    const motivationInterval = setInterval(() => {
      const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)]
      setMotivationMessage(randomMessage)
    }, 10000)

    return () => {
      clearInterval(timerInterval)
      clearInterval(bubbleInterval)
      clearInterval(animationInterval)
      clearInterval(motivationInterval)
    }
  }, [gameStarted])

  const generateBubble = () => {
    if (!gameAreaRef.current) return

    const sizes = [
      { size: 40, points: 5, color: 'from-blue-400 to-cyan-400', speed: 2 },
      { size: 60, points: 3, color: 'from-purple-400 to-pink-400', speed: 2.5 },
      { size: 80, points: 2, color: 'from-green-400 to-emerald-400', speed: 3 },
      { size: 100, points: 1, color: 'from-orange-400 to-red-400', speed: 3.5 },
    ]

    const randomSize = sizes[Math.floor(Math.random() * sizes.length)]
    const gameArea = gameAreaRef.current.getBoundingClientRect()

    const newBubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * (gameArea.width - randomSize.size),
      y: -randomSize.size, // Commencer en haut de l'écran
      size: randomSize.size,
      points: randomSize.points,
      color: randomSize.color,
      speed: randomSize.speed,
      horizontalSpeed: (Math.random() - 0.5) * 1.5, // Mouvement latéral léger
      wobble: Math.random() * Math.PI * 2 // Phase de l'oscillation
    }

    setBubbles(prev => [...prev, newBubble])

    // Retirer la bulle après 8 secondes (temps pour traverser l'écran)
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== newBubble.id))
    }, 8000)
  }

  const playPopSound = () => {
    // Créer un son d'éclatement avec Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Oscillateur pour le son principal
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Fréquence qui descend rapidement (effet "pop")
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)

    // Volume qui diminue rapidement
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.type = 'sine'
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const popBubble = (bubble, event) => {
    // Jouer le son
    playPopSound()

    // Ajouter score
    const newScore = score + bubble.points
    setScore(newScore)

    // Mettre à jour le record
    if (newScore > highScore) {
      setHighScore(newScore)
      localStorage.setItem('bubble_high_score', newScore.toString())
      setMotivationMessage("🏆 NOUVEAU RECORD ! Continue comme ça !")
    }

    // Message de combo tous les 50 points
    if (newScore % 50 === 0 && newScore > 0) {
      setMotivationMessage(`🔥 ${newScore} points ! Tu es en feu !`)
    }

    // Créer des particules d'explosion
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const newParticles = []
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      newParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: bubble.color
      })
    }
    setParticles(prev => [...prev, ...newParticles])

    // Retirer les particules après animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 500)

    // Retirer la bulle
    setBubbles(prev => prev.filter(b => b.id !== bubble.id))
  }

  const startGame = () => {
    setGameStarted(true)
    setScore(0)
    setTimer(300)
    setBubbles([])
  }

  const endGame = () => {
    setGameStarted(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1025] to-[#0f1419] text-white overflow-hidden">
      {/* Orbes colorées animées */}
      <div className="fixed top-[-150px] right-[-150px] w-[400px] h-[400px] bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-[100px] opacity-30 animate-pulse" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-[100px] opacity-30 animate-pulse" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/sos" className="flex items-center gap-2 text-purple-300 hover:text-white transition">
            ← Retour SOS
          </Link>
          <h1 className="text-lg font-semibold text-white">🎮 Jeu de Bulles</h1>
        </div>
      </header>

      {/* Stats */}
      <div className="fixed top-16 left-0 right-0 z-40 backdrop-blur-xl bg-white/5 border-b border-white/10 py-3">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-6">
            <div>
              <div className="text-xs text-purple-400">Score</div>
              <div className="text-2xl font-bold text-white">{score}</div>
            </div>
            <div>
              <div className="text-xs text-purple-400">Record</div>
              <div className="text-2xl font-bold text-cyan-400">{highScore}</div>
            </div>
          </div>
          {gameStarted && (
            <div>
              <div className="text-xs text-purple-400">Temps restant</div>
              <div className={`text-2xl font-bold ${timer < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(timer)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone de jeu */}
      <main className="relative pt-32 pb-8 px-4">
        <div className="max-w-6xl mx-auto">

          {!gameStarted ? (
            // Écran de démarrage
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-8xl mb-6">🫧</div>
              <h2 className="text-4xl font-bold text-white mb-4">Jeu de Bulles</h2>
              <p className="text-xl text-purple-300 mb-8">
                Éclate les bulles pour marquer des points !<br />
                Plus la bulle est petite, plus elle rapporte de points.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-3xl mb-2">🔵</div>
                  <div className="text-sm text-blue-300">Petite bulle</div>
                  <div className="text-xl font-bold text-white">5 pts</div>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-3xl mb-2">🟣</div>
                  <div className="text-sm text-purple-300">Moyenne bulle</div>
                  <div className="text-xl font-bold text-white">3 pts</div>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="text-3xl mb-2">🟢</div>
                  <div className="text-sm text-green-300">Grande bulle</div>
                  <div className="text-xl font-bold text-white">2 pts</div>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="text-3xl mb-2">🔴</div>
                  <div className="text-sm text-orange-300">Très grande</div>
                  <div className="text-xl font-bold text-white">1 pt</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xl font-bold hover:from-purple-600 hover:to-cyan-600 transition-all shadow-lg"
              >
                Commencer (5 min)
              </button>
            </div>
          ) : (
            // Zone de jeu active
            <div
              ref={gameAreaRef}
              className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              style={{ height: '70vh', minHeight: '500px' }}
            >
              {/* Message de motivation */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-6 py-3 text-center animate-pulse">
                <p className="text-sm font-semibold text-white">
                  {motivationMessage}
                </p>
              </div>

              {/* Bulles */}
              {bubbles.map((bubble) => (
                <button
                  key={bubble.id}
                  onClick={(e) => popBubble(bubble, e)}
                  className={`absolute rounded-full bg-gradient-to-br ${bubble.color} hover:scale-110 transition-transform cursor-pointer border-2 border-white/30`}
                  style={{
                    left: `${bubble.x}px`,
                    top: `${bubble.y}px`,
                    width: `${bubble.size}px`,
                    height: `${bubble.size}px`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset -10px -10px 20px rgba(255, 255, 255, 0.1), inset 10px 10px 20px rgba(0, 0, 0, 0.1)',
                    opacity: 0.85
                  }}
                >
                  {/* Reflet brillant sur la bulle */}
                  <div
                    className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full bg-white/40 blur-sm"
                    style={{ pointerEvents: 'none' }}
                  />
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: `${bubble.size / 4}px` }}>
                      +{bubble.points}
                    </span>
                  </div>
                </button>
              ))}

              {/* Particules d'explosion */}
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className={`absolute w-3 h-3 rounded-full bg-gradient-to-br ${particle.color} animate-ping`}
                  style={{
                    left: `${particle.x}px`,
                    top: `${particle.y}px`,
                    transform: `translate(${particle.vx * 50}px, ${particle.vy * 50}px)`
                  }}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
