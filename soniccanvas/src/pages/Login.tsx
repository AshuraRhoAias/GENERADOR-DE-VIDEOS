import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Music2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-[420px] mx-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Music2 size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">SonicCanvas</span>
        </div>

        {/* Card */}
        <div className="bg-[#111118] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm text-white/40 mb-7">Ingresa tu cuenta para continuar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
              {!loading && <Zap size={16} />}
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Regístrate gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Versión Free · Exporta en 720p con watermark
        </p>
      </motion.div>
    </div>
  )
}
