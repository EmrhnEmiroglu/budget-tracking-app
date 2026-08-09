import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Check, BellRing, Target, PieChart, MailCheck, RefreshCw } from 'lucide-react'
import { RingProgress, Sparkline } from '../components/ui'

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
      {/* Left decorative */}
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

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 40%, #000))' }}
          >
            <span className="display font-bold text-white text-base">₺</span>
          </div>
          <div className="display text-[17px] font-semibold" style={{ color: 'var(--text)' }}>Bütçe</div>
        </div>

        <div className="relative z-10">
          <div className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-3)' }}>
            finansal netlik
          </div>
          <h2 className="display text-[44px] font-semibold leading-[1.05] mt-3 max-w-[460px]" style={{ color: 'var(--text)' }}>
            Paranızın nereye gittiğini <span style={{ color: 'var(--accent)' }}>tam olarak</span> bilin.
          </h2>
          <div className="relative h-[280px] mt-10">
            <FloatCard style={{ top: 0, left: 0, '--r': '-4deg' }} className="float">
              <div className="mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>bu ay tasarruf</div>
              <div className="mono text-2xl font-semibold mt-1" style={{ color: 'var(--success)' }}>+₺2.400</div>
              <div className="mt-2">
                <Sparkline data={[10, 12, 11, 14, 13, 16, 17, 20, 19, 22]} w={180} h={32} color="var(--success)" />
              </div>
            </FloatCard>
            <FloatCard style={{ top: 80, right: 20, '--r': '3deg' }} className="float" delay="-2s">
              <div className="flex items-center gap-3 mt-1">
                <RingProgress pct={67} size={40} stroke={5} color="var(--success)" />
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Acil durum fonu</div>
                  <div className="text-[10px]" style={{ color: 'var(--success)' }}>%67 tamamlandı</div>
                </div>
              </div>
            </FloatCard>
            <FloatCard style={{ bottom: 0, left: 40, '--r': '-2deg' }} className="float" delay="-4s">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                <div className="text-[10px] mono uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>nisan 2026</div>
              </div>
              <div className="mono text-sm font-semibold" style={{ color: 'var(--text)' }}>Gider: ₺4.820</div>
              <div className="mono text-[11px] mt-0.5" style={{ color: 'var(--success)' }}>Gelir: ₺42.700</div>
            </FloatCard>
          </div>
        </div>

        <div className="relative z-10 text-xs" style={{ color: 'var(--text-3)' }}>
          © 2026 Bütçe · Türkiye&apos;de geliştirildi
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col justify-center p-8 md:p-16" style={{ background: 'var(--bg)' }}>
        {right}
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'verify'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalıdır'); return }
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır'); return }
    if (form.password !== form.confirmPassword) { setError('Şifreler eşleşmiyor'); return }

    setLoading(true)
    try {
      const result = await register(form.username, form.email, form.password)
      if (result.success && result.requiresVerification) {
        setStep('verify') // E-posta doğrulama adımına geç
      } else if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Kayıt başarısız')
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  // E-posta doğrulama adımı
  if (step === 'verify') {
    return <AuthShell right={<VerifyStep email={form.email} onDone={() => navigate('/')} />} />
  }

  return (
    <AuthShell right={
      <div className="max-w-[400px] w-full mx-auto rise">
        <div className="mono text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-3)' }}>
          başlayalım
        </div>
        <h1 className="display text-[36px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          Hesap Oluştur
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
          30 saniyede başlayın, kredi kartı gerekmez.
        </p>

        {/* Feature list */}
        <div className="mt-6 space-y-2">
          {[
            'Abonelik bildirimleri ve Telegram entegrasyonu',
            'Finansal hedefler ve ilerleme takibi',
            'Kategori bazlı detaylı analiz',
          ].map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in oklab, var(--success) 15%, transparent)', color: 'var(--success)' }}
              >
                <Check size={12} />
              </div>
              {t}
            </div>
          ))}
        </div>

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

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="field px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>ad soyad</div>
            <input value={form.username} onChange={set('username')} placeholder="Kullanıcı adı" className="text-sm" required />
          </div>
          <div className="field px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>email</div>
            <input type="email" value={form.email} onChange={set('email')} placeholder="siz@ornek.com" className="text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>şifre</div>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" className="text-sm mono" required />
            </div>
            <div className="field px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>tekrar</div>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" className="text-sm mono" required />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold btn-primary transition disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kayıt yapılıyor...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Hesap Oluştur
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-sm text-center" style={{ color: 'var(--text-2)' }}>
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Giriş Yap
          </Link>
        </div>
      </div>
    } />
  )
}

// E-posta doğrulama kodu giriş adımı (kayıt sonrası ve doğrulanmamış girişte kullanılır)
export function VerifyStep({ email, onDone }) {
  const { verifyEmail, resendCode } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (code.trim().length !== 6) { setError('Lütfen 6 haneli kodu giriniz'); return }
    setLoading(true)
    try {
      const result = await verifyEmail(email, code.trim())
      if (result.success) onDone()
      else setError(result.error || 'Doğrulama başarısız')
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError(''); setInfo('')
    setResending(true)
    try {
      const result = await resendCode(email)
      if (result.success) setInfo('Yeni kod e-posta adresinize gönderildi')
      else setError(result.error || 'Kod gönderilemedi')
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="max-w-[400px] w-full mx-auto rise">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'color-mix(in oklab, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
      >
        <MailCheck size={26} />
      </div>
      <h1 className="display text-[32px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
        E-postanı doğrula
      </h1>
      <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
        <span style={{ color: 'var(--accent)' }}>{email}</span> adresine 6 haneli bir doğrulama kodu gönderdik. Kodu aşağıya gir.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-xl text-sm"
          style={{ background: 'color-mix(in oklab, var(--danger) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {info && (
        <div className="mt-4 p-3 rounded-xl text-sm"
          style={{ background: 'color-mix(in oklab, var(--success) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--success) 30%, transparent)', color: 'var(--success)' }}>
          {info}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="field px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>doğrulama kodu</div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            className="text-2xl mono font-bold tracking-[0.4em] text-center w-full"
            style={{ color: 'var(--text)' }}
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold btn-primary transition disabled:opacity-50"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Check size={16} /> Doğrula ve Devam Et</>}
        </button>
      </form>

      <button
        onClick={resend}
        disabled={resending}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
      >
        <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
        {resending ? 'Gönderiliyor...' : 'Kodu Tekrar Gönder'}
      </button>
    </div>
  )
}
