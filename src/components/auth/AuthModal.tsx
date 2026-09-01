import React, { useState } from 'react'
import { X, Mail, Lock, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin'
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, isConfigured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos')
      return
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message)
        } else {
          onClose()
        }
      } else {
        const { error, needsEmailConfirmation } = await signUpWithEmail(email, password)
        if (error) {
          setErrorMsg(error.message)
        } else if (needsEmailConfirmation) {
          setSuccessMsg('¡Cuenta creada! Te enviamos un correo de confirmación.')
        } else {
          onClose()
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocurrió un error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setErrorMsg(error.message)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al conectar con Google')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-800 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          {mode === 'signin'
            ? 'Accedé a tu dashboard con todas tus carpetas y mapas sincronizados en la nube.'
            : 'Guardá tus mapas mentales automáticamente y organízalos en carpetas.'}
        </p>

        {!isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            Asegurate de haber configurado las variables de Supabase en tu archivo .env.
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 mb-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
          <span className="px-3 text-xs text-slate-400 font-medium">o con email</span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? 'Procesando...'
              : mode === 'signin'
                ? 'Iniciar Sesión'
                : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'signin' ? (
            <>
              ¿No tenés una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Registrate gratis
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Iniciá sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
