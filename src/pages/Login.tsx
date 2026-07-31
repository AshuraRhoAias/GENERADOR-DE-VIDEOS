import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Music2, Zap, Sparkles, Film, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const FEATURES = [
  { icon: Zap,      text: 'Audio reactivo en tiempo real' },
  { icon: Sparkles, text: 'Partículas 3D con WebGL' },
  { icon: Film,     text: 'Exporta en 4K sin límites' },
  { icon: Shield,   text: 'Proyectos guardados localmente' },
]

function VisualizerPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)
    let t = 0
    const draw = () => {
      t += 0.012
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      ctx.fillStyle = 'rgba(8,8,15,0.18)'
      ctx.fillRect(0, 0, w, h)
      const BARS = 36
      const bw = (w - 32) / BARS
      for (let i = 0; i < BARS; i++) {
        const norm = i / BARS
        const freq = 0.35 + 0.65 * Math.abs(Math.sin(norm * Math.PI * 3 + t * 1.2) + 0.35 * Math.sin(norm * Math.PI * 7 + t * 2.1))
        const bh = freq * h * 0.6
        const hue = 260 + norm * 60
        const grad = ctx.createLinearGradient(0, h * 0.72 - bh, 0, h * 0.72)
        grad.addColorStop(0, 'hsla(' + hue + ',80%,65%,' + (0.35 + freq * 0.5) + ')')
        grad.addColorStop(1, 'hsla(' + hue + ',70%,40%,0.04)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(16 + i * bw, h * 0.72 - bh, bw - 2, bh, [3, 3, 0, 0])
        ctx.fill()
      }
      for (let p = 0; p < 8; p++) {
        const px = (w * ((p * 0.13 + Math.sin(t * 0.4 + p) * 0.09) % 1))
        const py = (h * ((p * 0.11 + Math.sin(t * 0.3 + p * 1.5) * 0.08) % 1))
        ctx.beginPath()
        ctx.arc(px, py, 1.2 + Math.abs(Math.sin(t + p)) * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(167,139,250,0.35)'
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div className="hidden lg:flex flex-col w-[46%] relative overflow-hidden bg-[#080810]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/25 via-transparent to-indigo-900/15 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]">
            <Music2 size={17} className="text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">SonicCanvas</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Crea videos que<br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">vibran con el beat</span>
            </h2>
            <p className="text-sm text-white/38 leading-relaxed mb-8 max-w-xs">
              Arrastra tu audio y genera un video sincronizado con partículas y letras en segundos.
            </p>
            <div className="flex flex-col gap-3">
              {FEATURES.map(({ icon: Icon, text }, i) => (
                <motion.div key={text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/18 flex items-center justify-center shrink-0">
                    <Icon size={12} className="text-violet-400" />
                  </div>
                  <span className="text-xs text-white/50">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-white/45 leading-relaxed italic">"Generé 30 videos en una semana. La sincronización con el beat es perfecta."</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">D</div>
            <span className="text-[11px] text-white/30">DJ Vortex · YouTube 120k subs</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      <VisualizerPanel />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Music2 size={17} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">SonicCanvas</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm text-white/35 mb-8">Ingresa para continuar creando</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Correo electrónico" type="email" placeholder="tu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && (
              <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</div>
            )}
            <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full shadow-[0_0_20px_rgba(124,58,237,0.25)]">
              {!loading && <Zap size={15} />} Iniciar sesión
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
            <div className="relative text-center"><span className="bg-[#08080f] px-3 text-xs text-white/22">o</span></div>
          </div>

          <p className="text-center text-sm text-white/35">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
              Regístrate gratis →
            </Link>
          </p>
          <p className="text-center text-[11px] text-white/16 mt-8">Plan Free · 720p con watermark · Sin tarjeta</p>
        </motion.div>
      </div>
    </div>
  )
}
