import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Music2, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const FREE_PERKS = ['1 proyecto activo', 'Export 720p', 'Partículas 3D', 'Letras sincronizadas']
const PRO_PERKS = ['Proyectos ilimitados', '4K sin watermark', 'Templates premium', 'Prioridad de exportación']

export function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Left — plan comparison */}
      <div className="hidden lg:flex flex-col w-[46%] bg-[#0a0a14] border-r border-white/6 p-10 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]">
            <Music2 size={17} className="text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">SonicCanvas</span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-10 gap-5">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Empieza gratis</h2>
            <p className="text-sm text-white/38">Sin tarjeta de crédito. Upgrade cuando quieras.</p>
          </div>

          {/* Free plan */}
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white">Plan Free</span>
              <span className="text-lg font-black text-white">$0</span>
            </div>
            <div className="flex flex-col gap-2">
              {FREE_PERKS.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <Check size={12} className="text-violet-400 shrink-0" />
                  <span className="text-xs text-white/50">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro plan */}
          <div className="bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-500/25 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[10px] font-semibold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full">Popular</div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white">Plan Pro</span>
              <div className="text-right">
                <span className="text-lg font-black text-white">$4.99</span>
                <span className="text-xs text-white/35">/mes</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {PRO_PERKS.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <Check size={12} className="text-violet-400 shrink-0" />
                  <span className="text-xs text-white/60">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/20 text-center">Puedes cambiar de plan en cualquier momento</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Music2 size={17} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">SonicCanvas</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
          <p className="text-sm text-white/35 mb-8">Gratis para siempre · Sin tarjeta</p>

          {/* Free badge */}
          <div className="flex items-center gap-2 bg-violet-500/8 border border-violet-500/15 rounded-xl px-3 py-2.5 mb-5">
            <Sparkles size={13} className="text-violet-400 shrink-0" />
            <p className="text-xs text-violet-300/80">Empezarás con el Plan Free · Upgrade en cualquier momento</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Nombre" type="text" placeholder="Tu nombre"
              value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Correo electrónico" type="email" placeholder="tu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && (
              <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</div>
            )}
            <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full shadow-[0_0_20px_rgba(124,58,237,0.25)]">
              {!loading && <Sparkles size={15} />} Crear cuenta gratis
            </Button>
          </form>

          <p className="text-center text-sm text-white/35 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
              Iniciar sesión →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
