import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, BellRing, Target, PieChart, Check, X, KeyRound } from 'lucide-react'
import { RingProgress, Sparkline } from '../components/ui'
import { API_URL } from '../config'
import { VerifyStep } from './Register'

function FloatCard({ children, style, className = '' }) {
  return (
    <div
      className={`absolute card p-4 w-[230px] ${className}`}
      style={{ ...style, boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)' }}
    >
      {children}
    </div>
  )
}

function AuthShell({ right }) {
  return (
    <div
      className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] mesh"
      style={{ background: 'var(--bg)' }}
    >
      {/* Left decorative panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg), color-mix(in oklab, var(--accent) 22%, var(--bg)))'
        }}
      >
        <div className="absolute inset-0 dotgrid opacity-[0.06]" />
        <div
          className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full"
          style={{
            background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 45%, transparent), transparent 60%)',
            filter: 'blur(40px)'
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 40%, #000))' }}
          >
            <span className="display font-bold text-white text-base">₺</span>
          </div>
          <div className="display text-[17px] font-semibold" style={{ color: 'var(--text)' }}>Bütçe</div>
        </div>

        {/* Hero text + floating cards */}
        <div className="relative z-10">
          <div className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-3)' }}>
            finansal netlik
          </div>
          <h2 className="display text-[44px] font-semibold leading-[1.05] mt-3 max-w-[460px]" style={{ color: 'var(--text)' }}>
            Paranızın nereye gittiğini <span style={{ color: 'var(--accent)' }}>tam olarak</span> bilin.
          </h2>

          {/* Floating mini cards */}
          <div className="relative h-[280px] mt-10">
            <FloatCard style={{ top: 0, left: 0, '--r': '-4deg' }} className="float">
              <div className="mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>bu ay tasarruf</div>
              <div className="mono text-2xl font-semibold mt-1" style={{ color: 'var(--success)' }}>+₺2.400</div>
              <div className="mt-2">
                <Sparkline data={[10, 12, 11, 14, 13, 16, 17, 20, 19, 22]} w={180} h={32} color="var(--success)" />
              </div>
            </FloatCard>

            <FloatCard style={{ top: 80, right: 20, '--r': '3deg' }} className="float" delay="-2s">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ background: 'oklch(0.28 0.12 0)', color: 'oklch(0.92 0.14 0)' }}
                >N</div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Netflix ödemesi</div>
                  <div className="text-[10px]" style={{ color: 'var(--warning)' }}>3 gün kaldı</div>
                </div>
              </div>
              <div className="mono text-lg font-semibold mt-2" style={{ color: 'var(--text)' }}>₺289,99</div>
            </FloatCard>

            <FloatCard style={{ bottom: 0, left: 60, '--r': '-2deg' }} className="float" delay="-4s">
              <div className="mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>Japonya tatili</div>
              <div className="flex items-center gap-3 mt-2">
                <RingProgress pct={40} size={44} stroke={6} />
                <div>
                  <div className="mono text-sm font-semibold" style={{ color: 'var(--text)' }}>₺34.200</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>hedef ₺85.000</div>
                </div>
              </div>
            </FloatCard>
          </div>
        </div>

        <div className="relative z-10 text-xs" style={{ color: 'var(--text-3)' }}>
          © 2026 Bütçe · Türkiye&apos;de geliştirildi
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col justify-center p-8 md:p-16" style={{ background: 'var(--bg)' }}>
        {right}
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [needVerify, setNeedVerify] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/')
      } else if (result.requiresVerification) {
        setNeedVerify(true) // Doğrulanmamış hesap → kod doğrulama adımına geç
      } else {
        setError(result.error || 'Giriş başarısız')
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  // Doğrulanmamış hesap girişi denendiyse e-posta doğrulama adımını göster
  if (needVerify) {
    return <AuthShell right={<VerifyStep email={email} onDone={() => navigate('/')} />} />
  }

  return (
    <>
    <AuthShell right={
      <div className="max-w-[400px] w-full mx-auto rise">
        <div className="mono text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-3)' }}>
          hoş geldiniz
        </div>
        <h1 className="display text-[36px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          Giriş Yap
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
          Hesabınıza bağlanın ve bütçenize devam edin.
        </p>

        {error && (
          <div
            className="mt-4 p-3 rounded-xl text-sm"
            style={{
              background: 'color-mix(in oklab, var(--danger) 12%, transparent)',
              border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
              color: 'var(--danger)'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <div className="field px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>email</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="siz@ornek.com"
              className="text-sm"
              required
            />
          </div>

          <div className="field px-3 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-[0.15em] mono" style={{ color: 'var(--text-3)' }}>şifre</div>
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="text-[10px] font-medium"
                style={{ color: 'var(--accent)' }}
              >
                Unuttum
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="text-sm mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold btn-primary transition disabled:opacity-50 mt-6"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                Giriş Yap
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <div className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>veya</div>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <div className="mt-8 text-sm text-center" style={{ color: 'var(--text-2)' }}>
          Hesabın yok mu?{' '}
          <Link to="/register" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Kayıt Ol
          </Link>
        </div>
      </div>
    } />

    {resetOpen && <ResetPasswordModal onClose={() => setResetOpen(false)} />}
    </>
  )
}

function ResetPasswordModal({ onClose }) {
  const [step, setStep] = useState('email')   // 'email' | 'code' | 'done'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. ADIM: E-postaya sıfırlama kodu gönder
  const sendCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        setStep('code')
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  // 2. ADIM: Kod + yeni şifre ile sıfırlamayı onayla
  const confirmReset = async (e) => {
    e.preventDefault()
    setError('')
    if (code.trim().length !== 6) { setError('Lütfen 6 haneli kodu giriniz'); return }
    if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    if (newPassword !== confirm) { setError('Şifreler eşleşmiyor'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim(), newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setStep('done')
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rise"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'color-mix(in oklab, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
            >
              <KeyRound size={17} />
            </div>
            <div className="display font-semibold" style={{ color: 'var(--text)' }}>Şifre Sıfırla</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6">
          {step === 'done' ? (
            <div className="text-center py-4 space-y-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'color-mix(in oklab, var(--success) 15%, transparent)' }}
              >
                <Check size={26} style={{ color: 'var(--success)' }} />
              </div>
              <div className="font-semibold" style={{ color: 'var(--text)' }}>Şifre güncellendi!</div>
              <div className="text-sm" style={{ color: 'var(--text-2)' }}>Yeni şifrenle giriş yapabilirsin.</div>
              <button
                onClick={onClose}
                className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold btn-primary"
              >
                Tamam
              </button>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={sendCode} className="space-y-3">
              <div className="text-sm" style={{ color: 'var(--text-2)' }}>
                Kayıtlı e-posta adresinizi girin. Size 6 haneli bir sıfırlama kodu göndereceğiz.
              </div>
              {error && (
                <div className="p-3 rounded-xl text-sm"
                  style={{ background: 'color-mix(in oklab, var(--danger) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
              <div className="field px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>e-posta</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="siz@ornek.com"
                  className="text-sm"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Kod Gönder'}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="space-y-3">
              <div className="text-sm" style={{ color: 'var(--text-2)' }}>
                <span style={{ color: 'var(--accent)' }}>{email}</span> adresine gönderilen kodu ve yeni şifrenizi girin.
              </div>
              {error && (
                <div className="p-3 rounded-xl text-sm"
                  style={{ background: 'color-mix(in oklab, var(--danger) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
              <div className="field px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>doğrulama kodu</div>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  className="text-lg mono font-bold tracking-[0.3em] text-center"
                  required
                  autoFocus
                />
              </div>
              <div className="field px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>yeni şifre</div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm mono"
                  required
                />
              </div>
              <div className="field px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>şifre tekrar</div>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Şifreyi Güncelle'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setError('') }}
                className="w-full text-center text-xs mt-1"
                style={{ color: 'var(--text-3)' }}
              >
                ← E-postayı değiştir
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
