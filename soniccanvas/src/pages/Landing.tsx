import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const LYRICS = [
  'Drop the beat, feel the sound',
  'Neon lights, underground',
  'SonicCanvas — paint the night',
  'Every note becomes the light',
]

export function Landing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight

    const BARS = 80
    const PARTICLES = 100
    const particles = Array.from({ length: PARTICLES }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2 + 0.5,
      hue: Math.random() * 60 + 250,
    }))

    let t = 0
    let lyricIdx = 0
    let lyricTimer = 0
    let beatPhase = 0
    let beatIntensity = 0

    const draw = () => {
      t += 0.016
      lyricTimer += 0.016
      if (lyricTimer > 2.5) { lyricTimer = 0; lyricIdx = (lyricIdx + 1) % LYRICS.length }

      const bass = 0.5 + 0.5 * Math.sin(t * 1.8)
      const mid = 0.5 + 0.5 * Math.sin(t * 3.1 + 1)
      const treble = 0.5 + 0.5 * Math.sin(t * 5.7 + 2)
      const kick = bass > 0.85
      beatPhase += 0.016
      if (kick && beatIntensity < 1) beatIntensity = 1
      beatIntensity *= 0.93

      const w = W(); const h = H()

      // Background
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, w, h)

      // Beat flash
      if (beatIntensity > 0.1) {
        ctx.fillStyle = `rgba(124,58,237,${beatIntensity * 0.06})`
        ctx.fillRect(0, 0, w, h)
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      for (let gx = 0; gx < w; gx += 60) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
      }
      for (let gy = 0; gy < h; gy += 60) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx * (1 + bass * 0.8)
        p.y += p.vy * (1 + bass * 0.8)
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (1 + bass * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},80%,70%,0.5)`
        ctx.fill()
      }

      // Frequency bars (mirrored)
      const barW = (w - 32) / BARS
      const cx = w / 2
      for (let i = 0; i < BARS; i++) {
        const norm = i / BARS
        const freq = norm < 0.15
          ? bass * (0.6 + 0.4 * Math.sin(t * 2 + i))
          : norm < 0.6
          ? mid * (0.5 + 0.5 * Math.sin(t * 3 + i * 0.5))
          : treble * (0.3 + 0.7 * Math.sin(t * 6 + i * 0.2))
        const barH = Math.max(3, freq * h * 0.55)
        const x = cx + (i - BARS / 2) * barW
        const hue = 260 + norm * 60
        const alpha = 0.55 + freq * 0.4
        const grad = ctx.createLinearGradient(x, h * 0.7 - barH, x, h * 0.7)
        grad.addColorStop(0, `hsla(${hue},90%,65%,${alpha})`)
        grad.addColorStop(1, `hsla(${hue + 20},70%,40%,0.1)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x, h * 0.7 - barH, barW - 2, barH, [3, 3, 0, 0])
        ctx.fill()
        // Mirror reflection
        ctx.globalAlpha = 0.15
        ctx.fillStyle = `hsla(${hue},90%,65%,0.3)`
        ctx.beginPath()
        ctx.roundRect(x, h * 0.7, barW - 2, barH * 0.3, [0, 0, 3, 3])
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Waveform line
      ctx.beginPath()
      ctx.strokeStyle = `rgba(167,139,250,${0.3 + mid * 0.4})`
      ctx.lineWidth = 1.5
      for (let xi = 0; xi < w; xi++) {
        const norm = xi / w
        const y = h * 0.7 + Math.sin(norm * Math.PI * 8 + t * 3) * (8 + bass * 20)
                  + Math.sin(norm * Math.PI * 14 + t * 5) * (4 + mid * 10)
        xi === 0 ? ctx.moveTo(xi, y) : ctx.lineTo(xi, y)
      }
      ctx.stroke()

      // Active lyric
      const lyric = LYRICS[lyricIdx]
      const lyricProgress = Math.min(1, lyricTimer / 2.5)
      const fontSize = Math.min(w * 0.042, 28)
      ctx.font = `700 ${fontSize}px Inter,sans-serif`
      ctx.textAlign = 'center'
      const glowAlpha = 0.5 + bass * 0.5
      ctx.shadowColor = `rgba(167,139,250,${glowAlpha})`
      ctx.shadowBlur = 20 + bass * 30
      ctx.fillStyle = `rgba(255,255,255,${0.7 + bass * 0.3})`
      ctx.fillText(lyric, w / 2, h * 0.33)
      ctx.shadowBlur = 0

      // Lyric progress bar
      const barY = h * 0.38
      const barLeft = w * 0.2; const barRight = w * 0.8
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath(); ctx.roundRect(barLeft, barY, barRight - barLeft, 2, 1); ctx.fill()
      ctx.fillStyle = 'rgba(167,139,250,0.7)'
      ctx.beginPath(); ctx.roundRect(barLeft, barY, (barRight - barLeft) * lyricProgress, 2, 1); ctx.fill()

      // Scanline
      const scanY = ((t * 60) % (h + 40)) - 20
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      scanGrad.addColorStop(0, 'rgba(167,139,250,0)')
      scanGrad.addColorStop(0.5, 'rgba(167,139,250,0.04)')
      scanGrad.addColorStop(1, 'rgba(167,139,250,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 20, w, 40)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden flex flex-col">
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 shrink-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12 L5 4 L8 9 L11 5 L14 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SonicCanvas</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2"
          >
            {isAuthenticated ? 'Dashboard' : 'Iniciar sesión'}
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-full font-medium transition-colors"
          >
            {isAuthenticated ? 'Abrir app' : 'Empezar gratis'}
          </button>
        </div>
      </nav>

      {/* Hero split layout */}
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Left — Copy */}
        <div className="flex flex-col justify-center px-12 lg:px-20 w-full lg:w-[45%] shrink-0">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-300 font-medium">Exporta en 4K · Sin límites</span>
          </div>

          <h1 className="animate-fade-in-up delay-100 text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6">
            Crea videos<br />
            <span className="animate-gradient-x bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              que suenan
            </span>
            <br />tan bien como<br />
            se ven.
          </h1>

          <p className="animate-fade-in-up delay-200 text-base text-white/45 leading-relaxed mb-10 max-w-md">
            Arrastra tu audio, elige un template y SonicCanvas genera un video sincronizado con el beat en segundos. Letras automáticas, partículas reactivas, efectos 3D.
          </p>

          <div className="animate-fade-in-up delay-300 flex items-center gap-4 flex-wrap">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="btn-shine group relative inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] hover:-translate-y-0.5"
            >
              <span>Crear video gratis</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
            >
              Ver demo →
            </button>
          </div>

          {/* Social proof */}
          <div className="animate-fade-in-up delay-400 flex items-center gap-6 mt-10 pt-8 border-t border-white/8">
            {[
              { value: '4K', label: 'Exportación' },
              { value: '7+', label: 'Templates' },
              { value: '60fps', label: 'Fluido' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/30 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — App preview with canvas */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-8 py-6 min-w-0">
          {/* Fake app window */}
          <div className="animate-scale-in delay-200 hover-lift w-full max-w-2xl xl:max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] bg-[#0e0e16]">
            {/* Window titlebar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-[#111118]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 rounded px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] text-white/40 font-mono">REC · 4K</span>
              </div>
              <div className="text-[10px] text-white/20 font-mono">SonicCanvas v2.0</div>
            </div>

            {/* Canvas visualizer */}
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full"
              />
              {/* Corner info */}
              <div className="absolute top-2 left-2 text-[9px] text-white/20 font-mono bg-black/40 px-1.5 py-0.5 rounded">
                1920 × 1080 · 30fps
              </div>
            </div>

            {/* Fake timeline */}
            <div className="px-4 py-2.5 border-t border-white/8 bg-[#0e0e16]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M2 1.5l5 2.5-5 2.5V1.5z" fill="rgba(167,139,250,0.8)"/>
                  </svg>
                </div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500/60 rounded-full" style={{ width: '38%' }} />
                </div>
                <span className="text-[10px] text-white/25 font-mono shrink-0">1:24 / 3:47</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip — features */}
      <div className="animate-fade-in-up delay-500 relative z-10 border-t border-white/6 bg-[#0e0e16]/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-center gap-0 divide-x divide-white/8">
          {[
            { icon: '🎵', title: 'Audio reactivo', desc: 'FFT en tiempo real' },
            { icon: '✨', title: 'Partículas 3D', desc: 'WebGL acelerado' },
            { icon: '📝', title: 'Letras sync', desc: 'Karaoke automático' },
            { icon: '🎬', title: 'Exporta 4K', desc: 'H.264 / H.265' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 px-8 py-4 transition-colors hover:bg-white/[0.03]">
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-xs font-semibold text-white/70">{title}</div>
                <div className="text-[10px] text-white/30">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="animate-float-slow absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="animate-float-slow absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/6 rounded-full blur-[100px]" style={{ animationDelay: '-4s' }} />
      </div>
    </div>
  )
}
